import { useState } from "react";
import { Influencer } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useModal } from "@/context/modal-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { VideoIcon, PhoneIcon } from "lucide-react";

interface BookingSectionProps {
  influencer: Influencer;
}

export default function BookingSection({ influencer }: BookingSectionProps) {
  const { user } = useAuth();
  const { openVideoCall } = useModal();
  const { toast } = useToast();
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const [duration, setDuration] = useState(15); // minutes
  
  const handleScheduleCall = () => {
    // Check if user has enough balance
    const cost = calculateCost();
    
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to book a call",
        variant: "destructive",
      });
      return;
    }
    
    if (user.walletBalance < cost) {
      toast({
        title: "Insufficient balance",
        description: "Please add funds to your wallet",
        variant: "destructive",
      });
      return;
    }
    
    // Open video call modal with selected options
    openVideoCall({
      influencer,
      callType,
      duration,
      cost
    });
  };
  
  const calculateCost = () => {
    const ratePerMinute = callType === "audio" 
      ? influencer.audioCost 
      : influencer.videoCost;
    return ratePerMinute * duration;
  };
  
  const durationOptions = [5, 15, 30, 60];
  
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Book a Call</CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="video" onValueChange={(value) => setCallType(value as "audio" | "video")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video" className="flex items-center gap-1">
              <VideoIcon className="h-3.5 w-3.5" />
              <span>Video</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-1">
              <PhoneIcon className="h-3.5 w-3.5" />
              <span>Audio</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="video" className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="video-duration">Call Duration</Label>
              <Select 
                value={String(duration)} 
                onValueChange={(value) => setDuration(Number(value))}
              >
                <SelectTrigger id="video-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((mins) => (
                    <SelectItem key={mins} value={String(mins)}>
                      {mins} minutes (${(influencer.videoCost * mins).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Rate per minute</span>
                <span className="font-medium">${influencer.videoCost.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm">Total cost</span>
                <span className="font-semibold">${(influencer.videoCost * duration).toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="audio" className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="audio-duration">Call Duration</Label>
              <Select 
                value={String(duration)} 
                onValueChange={(value) => setDuration(Number(value))}
              >
                <SelectTrigger id="audio-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((mins) => (
                    <SelectItem key={mins} value={String(mins)}>
                      {mins} minutes (${(influencer.audioCost * mins).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Rate per minute</span>
                <span className="font-medium">${influencer.audioCost.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm">Total cost</span>
                <span className="font-semibold">${(influencer.audioCost * duration).toFixed(2)}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <Button 
          className="w-full" 
          onClick={handleScheduleCall}
        >
          {callType === "video" ? (
            <VideoIcon className="mr-2 h-4 w-4" />
          ) : (
            <PhoneIcon className="mr-2 h-4 w-4" />
          )}
          Start {callType === "video" ? "Video" : "Audio"} Call
        </Button>
      </CardFooter>
    </Card>
  );
}