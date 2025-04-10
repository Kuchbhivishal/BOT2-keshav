import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Booking, ContentPost, Message, Influencer, InsertContentPost } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChat } from "@/hooks/use-chat";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MessageCircleIcon, 
  UsersIcon, 
  CalendarIcon, 
  ImageIcon, 
  DollarSignIcon,
  FileTextIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  Loader2Icon,
  ArrowLeftIcon,
  PlusIcon
} from "lucide-react";
import { Link } from "wouter";

// Form schema for content creation
const contentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  contentType: z.string(),
  price: z.coerce.number().min(1, "Price must be at least 1"),
  mediaUrl: z.string().optional(),
  previewUrl: z.string().optional(),
  contentUrl: z.string().optional(),
});

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isAddingContent, setIsAddingContent] = useState(false);

  // Check if the user is an influencer
  const { data: influencerProfile } = useQuery<Influencer>({
    queryKey: ["/api/influencer/profile"],
    enabled: !!user,
  });

  // If user is not logged in or not an influencer, show message
  if (!user) return null;
  
  if (!influencerProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Helmet>
          <title>Influencer Dashboard | InfluencerConnect</title>
        </Helmet>
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Not an Influencer</h1>
          <p className="mb-6">You need an influencer account to access this dashboard.</p>
          <Link href="/">
            <Button>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Influencer Dashboard | InfluencerConnect</title>
      </Helmet>
      
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-xl font-bold text-primary mr-8">InfluencerConnect</a>
            </Link>
            <h1 className="text-xl font-semibold">Influencer Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <OnlineStatusToggle influencer={influencerProfile} />
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to User View
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={influencerProfile.profilePicture || undefined} alt={influencerProfile.fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                    {influencerProfile.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-2xl font-bold">{influencerProfile.fullName}</h2>
                    {influencerProfile.isVerified && (
                      <Badge variant="secondary">Verified</Badge>
                    )}
                    <Badge variant={influencerProfile.isOnline ? "success" : "secondary"} className="ml-2">
                      {influencerProfile.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <p className="text-gray-500">@{influencerProfile.handle}</p>
                  <p className="mt-2">{influencerProfile.bio}</p>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-right mb-2">
                    <p className="text-sm text-gray-500">Wallet Balance</p>
                    <p className="text-xl font-bold text-primary">₹{influencerProfile.walletBalance.toFixed(2)}</p>
                  </div>
                  <Link href={`/i/${influencerProfile.handle}`}>
                    <Button size="sm">View Public Profile</Button>
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Message Price</p>
                  <p className="text-lg font-semibold">₹{influencerProfile.messageCost}</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Audio Call</p>
                  <p className="text-lg font-semibold">₹{influencerProfile.audioCost}/min</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Video Call</p>
                  <p className="text-lg font-semibold">₹{influencerProfile.videoCost}/min</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Content Items</p>
                  <p className="text-lg font-semibold">
                    <ContentCountDisplay influencerId={influencerProfile.id} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Main Dashboard Tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="messages">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="messages">
                  <MessageCircleIcon className="h-4 w-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="bookings">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Bookings
                </TabsTrigger>
                <TabsTrigger value="content">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="earnings">
                  <DollarSignIcon className="h-4 w-4 mr-2" />
                  Earnings
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="messages">
                <MessagesDashboard 
                  influencerId={influencerProfile.id} 
                  selectedUserId={selectedUserId}
                  setSelectedUserId={setSelectedUserId}
                />
              </TabsContent>
              
              <TabsContent value="bookings">
                <BookingsDashboard influencerId={influencerProfile.id} />
              </TabsContent>
              
              <TabsContent value="content">
                <ContentDashboard 
                  influencerId={influencerProfile.id} 
                  isAddingContent={isAddingContent}
                  setIsAddingContent={setIsAddingContent}
                />
              </TabsContent>
              
              <TabsContent value="earnings">
                <EarningsDashboard influencerId={influencerProfile.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function OnlineStatusToggle({ influencer }: { influencer: Influencer }) {
  const { toast } = useToast();
  
  const updateStatusMutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      const res = await apiRequest("PATCH", `/api/influencer/status`, { isOnline });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/profile"] });
      toast({
        title: `You are now ${influencer.isOnline ? "offline" : "online"}`,
        description: `Users ${influencer.isOnline ? "won't" : "will"} be able to contact you.`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to update status",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });
  
  return (
    <div className="flex items-center space-x-2">
      <Switch 
        id="online-status" 
        checked={influencer.isOnline}
        disabled={updateStatusMutation.isPending}
        onCheckedChange={(checked) => updateStatusMutation.mutate(checked)}
      />
      <Label htmlFor="online-status" className="cursor-pointer">
        {influencer.isOnline ? "Online" : "Offline"}
      </Label>
    </div>
  );
}

function ContentCountDisplay({ influencerId }: { influencerId: number }) {
  const { data: content, isLoading } = useQuery<ContentPost[]>({
    queryKey: ["/api/influencer/content", influencerId],
    enabled: !!influencerId,
  });
  
  if (isLoading) return <Loader2Icon className="h-4 w-4 animate-spin" />;
  return <>{content?.length || 0}</>;
}

function MessagesDashboard({ 
  influencerId, 
  selectedUserId,
  setSelectedUserId
}: { 
  influencerId: number 
  selectedUserId: number | null
  setSelectedUserId: (id: number | null) => void
}) {
  // Get all unique users who have messaged this influencer
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/influencer/conversations", influencerId],
  });
  
  const { messages, sendMessage, loading: messagesLoading } = useChat();
  const [newMessage, setNewMessage] = useState("");
  
  const handleSendMessage = () => {
    if (!selectedUserId || !newMessage.trim()) return;
    
    sendMessage(selectedUserId, newMessage);
    setNewMessage("");
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* User list */}
      <Card className="md:col-span-1 overflow-hidden">
        <div className="p-4 border-b font-medium flex items-center">
          <UsersIcon className="h-4 w-4 mr-2" />
          Conversations
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {conversationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2Icon className="h-6 w-6 animate-spin text-primary/50" />
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((convo: any) => (
              <div 
                key={convo.userId}
                onClick={() => setSelectedUserId(convo.userId)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedUserId === convo.userId ? "bg-primary/5 border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={convo.user.profilePicture || undefined} alt={convo.user.fullName} />
                    <AvatarFallback>{convo.user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium line-clamp-1">{convo.user.fullName}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {convo.lastMessage?.content || "No messages"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
      
      {/* Message area */}
      <Card className="md:col-span-2 overflow-hidden flex flex-col">
        {!selectedUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-gray-500">
            <MessageCircleIcon className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Select a conversation</p>
            <p>Choose a user from the list to view your conversation</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b font-medium bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mr-2 md:hidden" 
                    onClick={() => setSelectedUserId(null)}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </Button>
                  <span>Chat with User #{selectedUserId}</span>
                </div>
              </div>
            </div>
            
            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2Icon className="h-6 w-6 animate-spin text-primary/50" />
                </div>
              ) : !messages || !messages[selectedUserId] || messages[selectedUserId].length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <MessageCircleIcon className="h-12 w-12 mb-2 text-gray-300" />
                  <p>No messages yet</p>
                </div>
              ) : (
                messages[selectedUserId].map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.isFromInfluencer ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-xl p-3 ${
                        msg.isFromInfluencer 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-gray-100 rounded-tl-none"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.isFromInfluencer ? "text-primary-50" : "text-gray-500"}`}>
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t">
              <div className="flex">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 mr-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function BookingsDashboard({ influencerId }: { influencerId: number }) {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/influencer/bookings", influencerId],
    enabled: !!influencerId,
  });
  
  const { toast } = useToast();
  
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/bookings", influencerId] });
      toast({
        title: "Booking updated",
        description: "The booking status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update booking",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }
  
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No Bookings Yet</h3>
        <p className="text-gray-500">
          You don't have any bookings at the moment.
        </p>
      </div>
    );
  }
  
  // Group bookings by status
  const pendingBookings = bookings.filter(b => b.status === "pending");
  const confirmedBookings = bookings.filter(b => b.status === "confirmed");
  const completedBookings = bookings.filter(b => b.status === "completed");
  const cancelledBookings = bookings.filter(b => b.status === "cancelled");
  
  return (
    <div className="space-y-6">
      {pendingBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Pending Bookings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                updateStatus={(status) => updateBookingStatusMutation.mutate({ id: booking.id, status })}
                isPending={updateBookingStatusMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
      
      {confirmedBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Confirmed Bookings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                updateStatus={(status) => updateBookingStatusMutation.mutate({ id: booking.id, status })}
                isPending={updateBookingStatusMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
      
      {completedBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Completed Bookings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                updateStatus={(status) => updateBookingStatusMutation.mutate({ id: booking.id, status })}
                isPending={updateBookingStatusMutation.isPending}
                isCompleted
              />
            ))}
          </div>
        </div>
      )}
      
      {cancelledBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Cancelled Bookings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cancelledBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                updateStatus={(status) => updateBookingStatusMutation.mutate({ id: booking.id, status })}
                isPending={updateBookingStatusMutation.isPending}
                isCancelled
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ 
  booking, 
  updateStatus, 
  isPending,
  isCompleted = false,
  isCancelled = false
}: { 
  booking: Booking
  updateStatus: (status: string) => void
  isPending: boolean
  isCompleted?: boolean
  isCancelled?: boolean
}) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
  };
  
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center">
              <h4 className="font-medium">{booking.callType.charAt(0).toUpperCase() + booking.callType.slice(1)} Call</h4>
              <Badge 
                className={`ml-2 ${statusColors[booking.status as keyof typeof statusColors]}`}
                variant="outline"
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">User #{booking.userId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">₹{booking.totalCost.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{booking.durationMinutes} minutes</p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Scheduled For</p>
              <p className="font-medium">
                {new Date(booking.scheduledFor).toLocaleDateString()} at {new Date(booking.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium">
                {new Date(booking.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        {!isCompleted && !isCancelled && (
          <div className="flex gap-2 mt-4">
            {booking.status === "pending" && (
              <>
                <Button 
                  onClick={() => updateStatus("confirmed")} 
                  disabled={isPending}
                  variant="default"
                  className="flex-1"
                  size="sm"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
                <Button 
                  onClick={() => updateStatus("cancelled")} 
                  disabled={isPending}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
            {booking.status === "confirmed" && (
              <>
                <Button 
                  onClick={() => updateStatus("completed")} 
                  disabled={isPending}
                  variant="default"
                  className="flex-1"
                  size="sm"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Mark Completed
                </Button>
                <Button 
                  onClick={() => updateStatus("cancelled")} 
                  disabled={isPending}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContentDashboard({ 
  influencerId, 
  isAddingContent, 
  setIsAddingContent 
}: { 
  influencerId: number
  isAddingContent: boolean
  setIsAddingContent: (value: boolean) => void
}) {
  const { data: content, isLoading } = useQuery<ContentPost[]>({
    queryKey: ["/api/influencer/content", influencerId],
    enabled: !!influencerId,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }
  
  if (isAddingContent) {
    return <AddContentForm influencerId={influencerId} onCancel={() => setIsAddingContent(false)} />;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Your Content</h3>
        <Button onClick={() => setIsAddingContent(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add New Content
        </Button>
      </div>
      
      {!content || content.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Content Yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first premium content for your followers.
          </p>
          <Button onClick={() => setIsAddingContent(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Content
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {content.map((item) => (
            <ContentCard key={item.id} content={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentCard({ content }: { content: ContentPost }) {
  const { data: purchaseStats } = useQuery({
    queryKey: ["/api/content", content.id, "stats"],
  });
  
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-gray-100 relative">
        {content.previewUrl ? (
          <img 
            src={content.previewUrl} 
            alt={content.title} 
            className="w-full h-full object-cover"
          />
        ) : content.contentType === "image" ? (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        ) : content.contentType === "video" ? (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <FileTextIcon className="h-12 w-12 text-gray-400" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <FileTextIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-black/70 text-white">
            ₹{content.price}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h4 className="font-semibold mb-1 line-clamp-1">{content.title}</h4>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {content.description || "No description"}
        </p>
        
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium capitalize">{content.contentType}</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium">{new Date(content.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Purchases</p>
            <p className="font-medium">{purchaseStats?.count || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddContentForm({ influencerId, onCancel }: { influencerId: number, onCancel: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof contentFormSchema>>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      contentType: "image",
      price: 100,
      mediaUrl: "",
      contentUrl: "",
      previewUrl: "",
    },
  });
  
  const createContentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof contentFormSchema>) => {
      const contentData: InsertContentPost = {
        ...values,
        influencerId,
      };
      const res = await apiRequest("POST", "/api/content", contentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Content created",
        description: "Your content has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/content", influencerId] });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: "Failed to create content",
        description: String(error),
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(values: z.infer<typeof contentFormSchema>) {
    createContentMutation.mutate(values);
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Add New Content</h3>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title for your content" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your content" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="text">Text/Article</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Content price" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="contentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content URL</FormLabel>
                    <FormControl>
                      <Input placeholder="URL to your full content" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      This is the full content that users will get after purchase
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="previewUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preview URL</FormLabel>
                    <FormControl>
                      <Input placeholder="URL to preview image or thumbnail" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      A preview image that will be shown to all users
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button variant="outline" onClick={onCancel} type="button">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createContentMutation.isPending}
                >
                  {createContentMutation.isPending && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Content
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function EarningsDashboard({ influencerId }: { influencerId: number }) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/influencer/transactions", influencerId],
    enabled: !!influencerId,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <DollarSignIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No Earnings Yet</h3>
        <p className="text-gray-500">
          You haven't received any payments yet.
        </p>
      </div>
    );
  }
  
  // Calculate total earnings
  const totalEarnings = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  
  // Group transactions by type
  const messageEarnings = transactions.filter(t => t.transactionType === "message").reduce((sum, t) => sum + t.amount, 0);
  const callEarnings = transactions.filter(t => t.transactionType === "call").reduce((sum, t) => sum + t.amount, 0);
  const contentEarnings = transactions.filter(t => t.transactionType === "content").reduce((sum, t) => sum + t.amount, 0);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Total Earnings</h4>
            <p className="text-3xl font-bold text-primary">₹{totalEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Messages</h4>
            <p className="text-2xl font-bold">₹{messageEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Calls</h4>
            <p className="text-2xl font-bold">₹{callEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Content</h4>
            <p className="text-2xl font-bold">₹{contentEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Transaction History</h3>
        <Card>
          <div className="p-0">
            <div className="border-b px-4 py-3 bg-muted/50 grid grid-cols-5 text-sm font-medium">
              <div>Date</div>
              <div>Type</div>
              <div>User</div>
              <div>Description</div>
              <div className="text-right">Amount</div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="border-b px-4 py-3 grid grid-cols-5 text-sm hover:bg-muted/20">
                  <div className="text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <Badge variant="outline" className="capitalize">
                      {transaction.transactionType}
                    </Badge>
                  </div>
                  <div>User #{transaction.userId}</div>
                  <div className="truncate">{transaction.description}</div>
                  <div className="text-right font-medium text-primary">
                    ₹{transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}