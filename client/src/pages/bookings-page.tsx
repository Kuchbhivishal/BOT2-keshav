import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { WalletProvider } from "@/hooks/use-wallet";
import { Booking, Influencer } from "@shared/schema";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PhoneIcon, 
  VideoIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  Loader2Icon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useModal } from "@/context/modal-context";

export default function BookingsPage() {
  return (
    <WalletProvider>
      <BookingsPageContent />
    </WalletProvider>
  );
}

function BookingsPageContent() {
  const { user } = useAuth();
  const { openVideoCall } = useModal();
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });
  
  const getInfluencerDetails = (influencerId: number) => {
    return useQuery<Influencer>({
      queryKey: [`/api/influencers/${influencerId}`],
      enabled: !!influencerId,
    });
  };
  
  if (!user) return null;
  
  const filteredBookings = activeTab === "all" 
    ? bookings 
    : bookings.filter(booking => booking.status === activeTab);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return "bg-green-100 text-green-700";
      case 'pending':
        return "bg-yellow-100 text-yellow-700";
      case 'completed':
        return "bg-blue-100 text-blue-700";
      case 'cancelled':
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const handleJoinCall = (booking: Booking, influencer: Influencer) => {
    if (booking.status !== 'confirmed') return;
    
    openVideoCall({
      influencer,
      callType: booking.callType as "audio" | "video",
      duration: booking.durationMinutes,
      cost: booking.callType === "audio" ? influencer.audioCost : influencer.videoCost
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <Helmet>
        <title>My Bookings | InfluConnect</title>
      </Helmet>
      
      <Sidebar />
      <MobileHeader />
      
      <main className="lg:ml-64 flex-1">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="mb-6">
            <h1 className="text-2xl font-poppins font-bold text-gray-800">My Bookings</h1>
            <p className="text-gray-600 mt-1">
              Manage your scheduled sessions with influencers
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              
              <div className="text-sm text-gray-500 hidden md:block">
                Showing {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2Icon className="h-8 w-8 animate-spin text-primary/50" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No bookings found</h3>
                    <p className="text-gray-500 mb-6">You don't have any {activeTab !== 'all' ? activeTab : ''} bookings yet.</p>
                    <Button>
                      Book a Session
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBookings.map((booking) => {
                    const { data: influencer, isLoading: influencerLoading } = getInfluencerDetails(booking.influencerId);
                    
                    return (
                      <Card key={booking.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {booking.callType.charAt(0).toUpperCase() + booking.callType.slice(1)} Call
                              </CardTitle>
                              <CardDescription>
                                {format(new Date(booking.scheduledAt), 'MMMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "flex items-center gap-1 capitalize font-normal",
                                getStatusColor(booking.status)
                              )}
                            >
                              {getStatusIcon(booking.status)}
                              <span>{booking.status}</span>
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pb-2">
                          {influencerLoading ? (
                            <div className="flex items-center gap-3 animate-pulse">
                              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                              <div className="space-y-2">
                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                <div className="h-3 w-32 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          ) : influencer ? (
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={influencer.profilePicture || undefined} alt={influencer.fullName} />
                                <AvatarFallback>{influencer.fullName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{influencer.fullName}</p>
                                <p className="text-sm text-gray-500">@{influencer.handle}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>?</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">Influencer</p>
                                <p className="text-sm text-gray-500">Not found</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-xs text-gray-500">Time</p>
                              <p className="font-medium">
                                {format(new Date(booking.scheduledAt), 'h:mm a')}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-xs text-gray-500">Duration</p>
                              <p className="font-medium">{booking.durationMinutes} minutes</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-xs text-gray-500">Call Type</p>
                              <p className="font-medium flex items-center">
                                {booking.callType === "audio" ? (
                                  <PhoneIcon className="h-3 w-3 mr-1 text-blue-500" />
                                ) : (
                                  <VideoIcon className="h-3 w-3 mr-1 text-blue-500" />
                                )}
                                {booking.callType.charAt(0).toUpperCase() + booking.callType.slice(1)}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-xs text-gray-500">Price</p>
                              <p className="font-medium">₹{booking.totalCost}</p>
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="pt-2">
                          {booking.status === 'confirmed' && (
                            <Button 
                              className="w-full"
                              onClick={() => influencer && handleJoinCall(booking, influencer)}
                            >
                              {booking.callType === "audio" ? (
                                <PhoneIcon className="h-4 w-4 mr-2" />
                              ) : (
                                <VideoIcon className="h-4 w-4 mr-2" />
                              )}
                              Join Call
                            </Button>
                          )}
                          
                          {booking.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              className="w-full"
                            >
                              <XCircleIcon className="h-4 w-4 mr-2" />
                              Cancel Booking
                            </Button>
                          )}
                          
                          {booking.status === 'completed' && (
                            <Button 
                              variant="outline" 
                              className="w-full"
                            >
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              Book Again
                            </Button>
                          )}
                          
                          {booking.status === 'cancelled' && (
                            <Button 
                              variant="outline" 
                              className="w-full"
                            >
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              Book New Session
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
