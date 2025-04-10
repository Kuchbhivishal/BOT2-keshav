import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/context/modal-context";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { VideoIcon, PhoneIcon, MicIcon, MicOffIcon, VideoOffIcon, PhoneOffIcon } from "lucide-react";

export function VideoCallModal() {
  const { videoCallState, closeVideoCall } = useModal();
  const { isOpen, influencer, callType, duration, cost } = videoCallState;
  const { user } = useAuth();
  const { toast } = useToast();
  const [callStatus, setCallStatus] = useState<"connecting" | "active" | "ended">("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // convert to seconds
  
  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookings", {
        influencerId: influencer?.id,
        callType,
        durationMinutes: duration,
        scheduledFor: new Date().toISOString(), // Immediate booking
        status: "active"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Call booked successfully",
        description: `You've booked a ${duration} minute ${callType} call with ${influencer?.fullName}.`,
      });
      
      // Simulate starting the call
      setCallStatus("active");
      
      // In a real application, you would start WebRTC connection here
      
      // Simulate countdown timer
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCallStatus("ended");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
      closeVideoCall();
    },
  });
  
  // Handle initiating call
  const handleStartCall = () => {
    if (!user || !influencer) return;
    
    // Check if user has enough balance
    if (user.walletBalance < cost) {
      toast({
        title: "Insufficient balance",
        description: "Please add funds to your wallet",
        variant: "destructive",
      });
      return;
    }
    
    bookingMutation.mutate();
  };
  
  // Handle ending call
  const handleEndCall = () => {
    setCallStatus("ended");
    
    // In a real application, you would end WebRTC connection here
    
    setTimeout(() => {
      closeVideoCall();
    }, 2000);
  };
  
  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  if (!isOpen || !influencer) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeVideoCall()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {callType === "video" ? (
              <VideoIcon className="h-5 w-5 text-primary" />
            ) : (
              <PhoneIcon className="h-5 w-5 text-primary" />
            )}
            {callType === "video" ? "Video" : "Audio"} Call
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          {/* Influencer info */}
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={influencer.profilePicture || undefined} alt={influencer.fullName} />
            <AvatarFallback className="text-lg font-semibold">{influencer.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <h3 className="text-lg font-semibold">{influencer.fullName}</h3>
          <p className="text-sm text-muted-foreground">@{influencer.handle}</p>
          
          {/* Call status */}
          <div className="mt-4 text-center">
            {callStatus === "connecting" && (
              <>
                <div className="flex justify-center mb-2">
                  <div className="flex space-x-2">
                    <div className="animate-bounce delay-75 h-2 w-2 rounded-full bg-primary/70"></div>
                    <div className="animate-bounce delay-100 h-2 w-2 rounded-full bg-primary/80"></div>
                    <div className="animate-bounce delay-150 h-2 w-2 rounded-full bg-primary/90"></div>
                    <div className="animate-bounce delay-200 h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                </div>
                <p className="text-sm">Connecting...</p>
              </>
            )}
            
            {callStatus === "active" && (
              <div className="flex flex-col items-center">
                <Badge variant="outline" className="mb-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                  Call in progress
                </Badge>
                <div className="text-xl font-mono mb-2">{formatTime(timeRemaining)}</div>
                <p className="text-xs text-muted-foreground mb-4">Time remaining</p>
                
                {/* Video container (placeholder) */}
                {callType === "video" && !isVideoOff && (
                  <div className="bg-gray-100 rounded-lg w-full aspect-video mb-4 flex items-center justify-center">
                    {/* In a real app, this would be the WebRTC video element */}
                    <p className="text-muted-foreground">Video stream would appear here</p>
                  </div>
                )}
                
                {/* Audio-only or video off indicator */}
                {(callType === "audio" || isVideoOff) && (
                  <div className="w-full aspect-video mb-4 flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg">
                    <Avatar className="h-16 w-16 mb-2">
                      <AvatarFallback className="text-lg font-semibold">{influencer.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">
                      {callType === "audio" ? "Audio only" : "Video off"}
                    </p>
                  </div>
                )}
                
                {/* Call controls */}
                <div className="flex space-x-3 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? (
                      <MicOffIcon className="h-5 w-5 text-destructive" />
                    ) : (
                      <MicIcon className="h-5 w-5" />
                    )}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full h-10 w-10"
                    onClick={handleEndCall}
                  >
                    <PhoneOffIcon className="h-5 w-5" />
                  </Button>
                  
                  {callType === "video" && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={() => setIsVideoOff(!isVideoOff)}
                    >
                      {isVideoOff ? (
                        <VideoOffIcon className="h-5 w-5 text-destructive" />
                      ) : (
                        <VideoIcon className="h-5 w-5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {callStatus === "ended" && (
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Call ended</Badge>
                <p className="text-sm text-muted-foreground">
                  Your {duration} minute call with {influencer.fullName} has ended.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          {callStatus === "connecting" && (
            <div className="flex w-full justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">${cost.toFixed(2)}</span>
                <span className="text-muted-foreground"> for {duration} min</span>
              </div>
              <Button 
                onClick={handleStartCall}
                disabled={bookingMutation.isPending}
                className="min-w-[120px]"
              >
                {bookingMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    <span>Starting...</span>
                  </div>
                ) : (
                  <span>Start Call</span>
                )}
              </Button>
            </div>
          )}
          
          {callStatus === "ended" && (
            <Button 
              variant="outline"
              onClick={closeVideoCall}
              className="w-full"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}