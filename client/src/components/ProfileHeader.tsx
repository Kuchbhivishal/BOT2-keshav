import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Influencer } from "@shared/schema";
import { CheckIcon, MessageCircleIcon, VideoIcon, PhoneIcon } from "lucide-react";
import { useModal } from "@/context/modal-context";

interface ProfileHeaderProps {
  influencer: Influencer;
}

export default function ProfileHeader({ influencer }: ProfileHeaderProps) {
  const { openVideoCall } = useModal();
  
  const handleVideoCall = () => {
    openVideoCall({
      influencer,
      callType: "video",
      duration: 15, // Default 15 minutes
      cost: 15 * influencer.videoCost
    });
  };
  
  const handleAudioCall = () => {
    openVideoCall({
      influencer,
      callType: "audio",
      duration: 15, // Default 15 minutes
      cost: 15 * influencer.audioCost
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* Banner */}
      <div 
        className="h-32 sm:h-48 bg-gradient-to-r from-primary/40 to-primary/20"
      />
      
      <div className="p-4 sm:p-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end -mt-12 sm:-mt-20 mb-4 gap-4">
          {/* Avatar */}
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white shadow-md">
            <AvatarImage src={influencer.profilePicture || undefined} alt={influencer.fullName} />
            <AvatarFallback className="text-lg font-bold">
              {influencer.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Name + Status */}
          <div className="sm:pb-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{influencer.fullName}</h1>
              
              {influencer.isVerified && (
                <Badge variant="secondary" className="font-medium">
                  <CheckIcon className="h-3.5 w-3.5 mr-1" />
                  Verified
                </Badge>
              )}
              
              {influencer.isOnline && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                  Online
                </Badge>
              )}
            </div>
            
            <div className="text-gray-500 mt-1">@{influencer.handle}</div>
          </div>
          
          {/* Call Actions */}
          <div className="flex gap-2 self-stretch sm:self-end mt-4 sm:mt-0">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={handleAudioCall}
            >
              <PhoneIcon className="mr-1 h-4 w-4" />
              <span className="sm:inline">Audio</span>
            </Button>
            
            <Button 
              className="flex-1"
              onClick={handleVideoCall}
            >
              <VideoIcon className="mr-1 h-4 w-4" />
              <span className="sm:inline">Video</span>
            </Button>
          </div>
        </div>
        
        {/* Bio */}
        {influencer.bio && (
          <div className="mb-4">
            <p className="text-gray-600 whitespace-pre-line">
              {influencer.bio}
            </p>
          </div>
        )}
        
        {/* Rate Cards */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-sm text-gray-500">Chat</div>
            <div className="font-semibold">${influencer.messageCost}/msg</div>
          </div>
          
          <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-sm text-gray-500">Audio</div>
            <div className="font-semibold">${influencer.audioCost}/min</div>
          </div>
          
          <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-sm text-gray-500">Video</div>
            <div className="font-semibold">${influencer.videoCost}/min</div>
          </div>
        </div>
      </div>
    </div>
  );
}