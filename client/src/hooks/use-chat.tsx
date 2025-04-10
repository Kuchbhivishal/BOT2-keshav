import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Message } from "@shared/schema";

interface ChatContextType {
  sendMessage: (influencerId: number, content: string) => void;
  messages: Record<number, Message[]>;
  loading: boolean;
  error: Error | null;
  connected: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  
  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (!user) {
      setConnected(false);
      return;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const wsConnection = new WebSocket(wsUrl);
    
    wsConnection.onopen = () => {
      setConnected(true);
      setLoading(false);
      setError(null);
      
      // Send auth message once connected
      wsConnection.send(JSON.stringify({
        type: "auth",
        userId: user.id
      }));
    };
    
    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === "chat_message") {
          handleChatMessage(data.message);
        } else if (data.type === "chat_history") {
          // Update messages with history
          setMessages(prevMessages => {
            const influencerId = data.influencerId;
            return {
              ...prevMessages,
              [influencerId]: data.messages
            };
          });
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };
    
    wsConnection.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError(new Error("Failed to connect to chat service"));
      setLoading(false);
    };
    
    wsConnection.onclose = () => {
      setConnected(false);
    };
    
    setSocket(wsConnection);
    
    // Cleanup on unmount
    return () => {
      wsConnection.close();
    };
  }, [user]);
  
  const handleChatMessage = (message: Message) => {
    setMessages(prevMessages => {
      const influencerId = message.influencerId;
      const existingMessages = prevMessages[influencerId] || [];
      
      return {
        ...prevMessages,
        [influencerId]: [...existingMessages, message]
      };
    });
  };
  
  const sendMessage = (influencerId: number, content: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !user) {
      setError(new Error("Not connected to chat service"));
      return;
    }
    
    socket.send(JSON.stringify({
      type: "chat_message",
      userId: user.id,
      influencerId,
      content
    }));
  };
  
  return (
    <ChatContext.Provider value={{
      sendMessage,
      messages,
      loading,
      error,
      connected
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export function useInfluencerMessages(influencerId: number) {
  const { messages, loading, error, connected, sendMessage } = useChat();
  
  const influencerMessages = messages[influencerId] || [];
  
  return {
    messages: influencerMessages,
    loading,
    error,
    connected,
    sendMessage: (content: string) => sendMessage(influencerId, content)
  };
}