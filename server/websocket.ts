import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

interface Connection {
  userId?: number;
  influencerId?: number;
  socket: WebSocket;
}

export function setupWebsocketServer(server: Server) {
  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Store all connections
  const connections: Connection[] = [];
  
  wss.on('connection', (socket) => {
    console.log('WebSocket client connected');
    
    // Store connection
    const connection: Connection = {
      socket
    };
    connections.push(connection);
    
    // Handle messages
    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle message based on type
        switch (data.type) {
          case 'auth':
            handleAuth(connection, data);
            break;
            
          case 'chat':
            await handleChatMessage(connection, data);
            break;
            
          case 'call_signal':
            handleCallSignal(connection, data);
            break;
            
          case 'status_update':
            handleStatusUpdate(connection, data);
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    socket.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Remove connection from array
      const index = connections.indexOf(connection);
      if (index !== -1) {
        connections.splice(index, 1);
      }
      
      // Update influencer status if applicable
      if (connection.influencerId) {
        storage.updateInfluencerStatus(connection.influencerId, false)
          .then(() => {
            broadcastStatus(connection.influencerId!, false);
          })
          .catch(error => {
            console.error('Error updating influencer status:', error);
          });
      }
    });
  });
  
  // Helper function to handle authentication
  function handleAuth(connection: Connection, message: any) {
    const { userId, influencerId } = message;
    
    if (userId) {
      connection.userId = userId;
      console.log(`User ${userId} authenticated via WebSocket`);
    }
    
    if (influencerId) {
      connection.influencerId = influencerId;
      console.log(`Influencer ${influencerId} authenticated via WebSocket`);
      
      // Update influencer status to online
      storage.updateInfluencerStatus(influencerId, true)
        .then(() => {
          broadcastStatus(influencerId, true);
        })
        .catch(error => {
          console.error('Error updating influencer status:', error);
        });
    }
    
    // Send confirmation
    const response = {
      type: 'auth_success',
      userId: connection.userId,
      influencerId: connection.influencerId
    };
    
    connection.socket.send(JSON.stringify(response));
  }
  
  // Helper function to handle chat messages
  async function handleChatMessage(connection: Connection, message: any) {
    const { content, recipientId, recipientType } = message;
    
    if (!connection.userId && !connection.influencerId) {
      console.log('Unauthenticated client attempted to send message');
      return;
    }
    
    // Determine sender info
    const senderId = connection.userId || connection.influencerId;
    const senderType = connection.userId ? 'user' : 'influencer';
    
    if (!senderId) {
      console.log('No sender ID available');
      return;
    }
    
    // Create message record
    try {
      const userId = senderType === 'user' ? senderId : recipientId;
      const influencerId = senderType === 'influencer' ? senderId : recipientId;
      const cost = senderType === 'user' ? 0 : 0; // For influencer messages, cost is 0
      
      // Store message in database
      const savedMessage = await storage.createMessage({
        userId,
        influencerId,
        content,
        senderType,
        senderId,
        receiverId: recipientId,
        cost
      });
      
      // Broadcast message to recipient
      const targetConnections = connections.filter(conn => {
        if (recipientType === 'user' && conn.userId === recipientId) {
          return true;
        }
        if (recipientType === 'influencer' && conn.influencerId === recipientId) {
          return true;
        }
        return false;
      });
      
      // Format message for client
      const outgoingMessage = {
        type: 'chat_message',
        message: savedMessage
      };
      
      // Send to all recipient connections
      targetConnections.forEach(conn => {
        if (conn.socket.readyState === WebSocket.OPEN) {
          conn.socket.send(JSON.stringify(outgoingMessage));
        }
      });
      
      // Also send confirmation back to sender
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(JSON.stringify({
          type: 'message_sent',
          message: savedMessage
        }));
      }
    } catch (error) {
      console.error('Error handling chat message:', error);
      
      // Send error to client
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          message: 'Failed to send message'
        }));
      }
    }
  }
  
  // Helper function to handle call signaling
  function handleCallSignal(connection: Connection, message: any) {
    const { signal, recipientId, recipientType } = message;
    
    if (!connection.userId && !connection.influencerId) {
      console.log('Unauthenticated client attempted to send signal');
      return;
    }
    
    // Determine sender info
    const senderId = connection.userId || connection.influencerId;
    const senderType = connection.userId ? 'user' : 'influencer';
    
    if (!senderId) {
      console.log('No sender ID available');
      return;
    }
    
    // Find recipient connection
    const targetConnections = connections.filter(conn => {
      if (recipientType === 'user' && conn.userId === recipientId) {
        return true;
      }
      if (recipientType === 'influencer' && conn.influencerId === recipientId) {
        return true;
      }
      return false;
    });
    
    // Format signal for client
    const outgoingSignal = {
      type: 'call_signal',
      signal,
      senderId,
      senderType
    };
    
    // Send to all recipient connections
    targetConnections.forEach(conn => {
      if (conn.socket.readyState === WebSocket.OPEN) {
        conn.socket.send(JSON.stringify(outgoingSignal));
      }
    });
  }
  
  // Helper function to handle status updates
  function handleStatusUpdate(connection: Connection, message: any) {
    const { isOnline } = message;
    
    if (!connection.influencerId) {
      console.log('Non-influencer attempted to update status');
      return;
    }
    
    // Update influencer status
    storage.updateInfluencerStatus(connection.influencerId, isOnline)
      .then(() => {
        broadcastStatus(connection.influencerId!, isOnline);
      })
      .catch(error => {
        console.error('Error updating influencer status:', error);
      });
  }
  
  // Helper function to broadcast status updates
  function broadcastStatus(influencerId: number, isOnline: boolean) {
    const statusUpdate = {
      type: 'influencer_status',
      influencerId,
      isOnline
    };
    
    // Broadcast to all connections
    connections.forEach(conn => {
      if (conn.socket.readyState === WebSocket.OPEN) {
        conn.socket.send(JSON.stringify(statusUpdate));
      }
    });
  }
  
  return wss;
}