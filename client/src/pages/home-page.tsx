import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Influencer } from "@shared/schema";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircleIcon, 
  PhoneIcon, 
  VideoIcon, 
  CheckIcon, 
  Loader2,
  SparklesIcon 
} from "lucide-react";
import { WalletProvider } from "@/hooks/use-wallet";
import { ChatProvider } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: influencers = [], isLoading } = useQuery<Influencer[]>({
    queryKey: ["/api/influencers"],
    enabled: !!user,
  });
  
  if (!user) return null;
  
  return (
    <WalletProvider>
      <ChatProvider>
        <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
          <Helmet>
            <title>Home | InfluConnect</title>
          </Helmet>
          
          <Sidebar />
          <MobileHeader />
          
          <main className="lg:ml-64 flex-1">
            <div className="container mx-auto px-4 py-6 max-w-6xl">
              <div className="mb-6">
                <h1 className="text-2xl font-poppins font-bold text-gray-800">
                  Welcome, {user.fullName}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Connect with your favorite influencers through chat, audio, and video calls.
                </p>
              </div>
              
              <div className="mb-8 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-center justify-between">
                  <div className="mb-4 sm:mb-0">
                    <h2 className="text-lg font-semibold text-gray-800">Your Wallet Balance</h2>
                    <div className="mt-1 flex items-center">
                      <span className="text-2xl font-bold text-primary">₹{user.walletBalance.toFixed(2)}</span>
                      <Link href="/wallet">
                        <Button 
                          variant="link" 
                          className="text-primary underline pl-2" 
                          size="sm"
                        >
                          Manage Wallet
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/bookings">
                      <Button className="bg-accent hover:bg-accent/90 text-white">
                        View Your Bookings
                      </Button>
                    </Link>
                    <BecomeInfluencerButton />
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-4">Featured Influencers</h2>
              
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
              ) : influencers.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">
                  <p className="mb-2">No influencers available yet</p>
                  <p className="text-sm">Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {influencers.map((influencer) => (
                    <InfluencerCard key={influencer.id} influencer={influencer} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </ChatProvider>
    </WalletProvider>
  );
}

function BecomeInfluencerButton() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isCheckingInfluencer, setIsCheckingInfluencer] = useState(false);
  const { isPending: isLoading, mutate } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/become-influencer", {
        bio: "Hello! I'm new to the platform as an influencer.",
        handle: `${Math.random().toString(36).substring(2, 7)}` // Generate a random handle
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You are now registered as an influencer! Redirecting to dashboard...",
        variant: "default",
      });
      // Redirect to influencer dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to become an influencer",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // First check if user is already an influencer
  const checkInfluencerStatus = async () => {
    setIsCheckingInfluencer(true);
    try {
      const res = await fetch('/api/influencer/profile');
      if (res.ok) {
        // Already an influencer, redirect to dashboard
        toast({
          title: "You're already an influencer!",
          description: "Redirecting to your dashboard...",
          variant: "default",
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        // Not an influencer, trigger the mutation
        mutate();
      }
    } catch (err) {
      toast({
        title: "Error checking status",
        description: "Could not verify your account status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingInfluencer(false);
    }
  };
  
  return (
    <Button 
      variant="outline"
      className="border-purple-300 text-purple-600 hover:bg-purple-50"
      onClick={checkInfluencerStatus}
      disabled={isLoading || isCheckingInfluencer}
    >
      {isLoading || isCheckingInfluencer ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <SparklesIcon className="mr-2 h-4 w-4" />
      )}
      Become an Influencer
    </Button>
  );
}

function InfluencerCard({ influencer }: { influencer: Influencer }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-32 bg-gradient-to-r from-primary/30 to-secondary/30 relative">
        {influencer.isOnline && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-primary/10 backdrop-blur-sm text-primary text-xs rounded-full flex items-center">
            <span className="live-indicator inline-block w-2 h-2 bg-primary rounded-full mr-1"></span>
            Online
          </div>
        )}
      </div>
      
      <CardContent className="pt-12 pb-4 relative">
        <div className="absolute -top-8 left-4">
          <Avatar className="h-16 w-16 border-4 border-white">
            <AvatarImage src={influencer.profilePicture || undefined} alt={influencer.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {influencer.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex items-center mb-1 mt-1">
          <h3 className="font-semibold text-lg">{influencer.fullName}</h3>
          {influencer.isVerified && (
            <div className="ml-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
              <CheckIcon className="text-white h-3 w-3" />
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mb-3">@{influencer.handle}</p>
        
        <p className="text-sm text-gray-600 line-clamp-2">
          {influencer.bio || "No bio available"}
        </p>
        
        <div className="flex justify-between mt-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Message</p>
            <p className="font-medium">₹{influencer.messageCost}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Audio</p>
            <p className="font-medium">₹{influencer.audioCost}/min</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Video</p>
            <p className="font-medium">₹{influencer.videoCost}/min</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2 pt-2 pb-4">
        <Link href={`/i/${influencer.handle}`} className="flex-1">
          <Button 
            variant="default" 
            className="w-full bg-primary hover:bg-primary/90"
            size="sm"
          >
            <MessageCircleIcon className="mr-1 h-4 w-4" />
            Chat
          </Button>
        </Link>
        
        <Link href={`/i/${influencer.handle}`} className="flex-1">
          <Button 
            variant="outline" 
            className="w-full border-gray-200"
            size="sm"
          >
            <VideoIcon className="mr-1 h-4 w-4 text-secondary" />
            Call
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
