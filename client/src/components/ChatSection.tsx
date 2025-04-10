import { useState, useRef, useEffect } from "react";
import { Influencer, Message } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useInfluencerMessages } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Loader2, SendIcon } from "lucide-react";

interface ChatSectionProps {
  influencer: Influencer;
}

export default function ChatSection({ influencer }: ChatSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    loading, 
    error, 
    connected,
    sendMessage
  } = useInfluencerMessages(influencer.id);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Handle send message
  const handleSendMessage = () => {
    if (!message.trim()) return;
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to send messages",
        variant: "destructive",
      });
      return;
    }
    
    if (!connected) {
      toast({
        title: "Not connected",
        description: "Unable to connect to chat service",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has enough balance
    if (user.walletBalance < influencer.messageCost) {
      toast({
        title: "Insufficient balance",
        description: "Please add funds to your wallet",
        variant: "destructive",
      });
      return;
    }
    
    sendMessage(message.trim());
    setMessage("");
  };
  
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Chat with {influencer.fullName}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Messages container */}
        <div className="h-96 overflow-y-auto p-4 flex flex-col space-y-4">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-destructive">Failed to load messages</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col p-6">
              <p className="text-muted-foreground text-center">
                No messages yet. Send a message to start the conversation.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Each message costs ${influencer.messageCost}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                isUser={msg.senderId === user?.id}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message input */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Textarea
              placeholder={`Send a message to ${influencer.fullName}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-12 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              size="icon" 
              onClick={handleSendMessage}
              disabled={!message.trim() || !connected}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 px-1 flex justify-between">
            <span>Message cost: ${influencer.messageCost}</span>
            <span>
              {!connected && (
                <span className="text-amber-600">⚠️ Not connected</span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChatMessageProps {
  message: Message;
  isUser: boolean;
}

function ChatMessage({ message, isUser }: ChatMessageProps) {
  const { timestamp, content, senderType } = message;
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarFallback className={isUser ? "bg-primary/10" : "bg-secondary/10"}>
            {isUser ? "U" : "I"}
          </AvatarFallback>
        </Avatar>
        
        {/* Message bubble */}
        <div className="flex flex-col">
          <div 
            className={`rounded-lg px-3 py-2 text-sm ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            {content}
          </div>
          
          {/* Timestamp */}
          <span className={`text-xs text-gray-500 mt-1 ${isUser ? "text-right" : "text-left"}`}>
            {timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : "Just now"}
          </span>
        </div>
      </div>
    </div>
  );
}