import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Influencer, ContentPost } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, ShoppingCart, Image, FileText, Video } from "lucide-react";
import { format } from "date-fns";

interface ContentFeedSectionProps {
  influencer: Influencer;
}

export default function ContentFeedSection({ influencer }: ContentFeedSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contentType, setContentType] = useState<string>("all");
  
  // Fetch content posts
  const { data: contentPosts = [], isLoading } = useQuery<ContentPost[]>({
    queryKey: [`/api/content/${influencer.id}`],
    enabled: !!influencer,
  });
  
  // Fetch purchased content
  const { data: purchasedContent = [] } = useQuery<{ contentId: number }[]>({
    queryKey: ["/api/content/purchases"],
    enabled: !!user,
  });
  
  // Purchase content mutation
  const purchaseMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const res = await apiRequest("POST", "/api/content/purchase", {
        contentId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Content purchased",
        description: "You now have access to this content",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const isPurchased = (contentId: number) => {
    return purchasedContent.some((item) => item.contentId === contentId);
  };
  
  const handlePurchase = (contentPost: ContentPost) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to purchase content",
        variant: "destructive",
      });
      return;
    }
    
    if (user.walletBalance < contentPost.price) {
      toast({
        title: "Insufficient balance",
        description: "Please add funds to your wallet",
        variant: "destructive",
      });
      return;
    }
    
    purchaseMutation.mutate(contentPost.id);
  };
  
  // Filter content by type
  const filteredContent = contentPosts.filter((post) => {
    if (contentType === "all") return true;
    return post.contentType === contentType;
  });
  
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "text":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="border border-gray-100 shadow-sm mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Exclusive Content</CardTitle>
          {contentPosts.length > 0 && (
            <Badge variant="outline">
              {contentPosts.length} {contentPosts.length === 1 ? "item" : "items"}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
          </div>
        ) : contentPosts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>No content available yet</p>
            <p className="text-sm mt-1">Check back later for exclusive content from {influencer.fullName}</p>
          </div>
        ) : (
          <>
            <Tabs defaultValue="all" onValueChange={setContentType} className="mb-4">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="image">Images</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
                <TabsTrigger value="text">Articles</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-4">
              {filteredContent.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No {contentType} content available
                </div>
              ) : (
                filteredContent.map((post) => {
                  const hasPurchased = isPurchased(post.id);
                  return (
                    <div
                      key={post.id}
                      className="group rounded-lg border border-gray-200 overflow-hidden transition-all hover:border-gray-300"
                    >
                      {/* Preview section */}
                      <div className="relative bg-gray-100 h-40 overflow-hidden">
                        {post.previewUrl ? (
                          <img
                            src={post.previewUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gray-100">
                            {getContentTypeIcon(post.contentType)}
                            <span className="ml-2 text-sm text-muted-foreground">
                              {post.contentType} preview
                            </span>
                          </div>
                        )}
                        
                        {/* Content type badge */}
                        <div className="absolute top-2 left-2">
                          <Badge
                            variant="secondary"
                            className="bg-white/80 backdrop-blur-sm"
                          >
                            <span className="flex items-center gap-1">
                              {getContentTypeIcon(post.contentType)}
                              <span>
                                {post.contentType.charAt(0).toUpperCase() +
                                  post.contentType.slice(1)}
                              </span>
                            </span>
                          </Badge>
                        </div>
                        
                        {/* Lock overlay for non-purchased content */}
                        {!hasPurchased && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Lock className="h-6 w-6 text-white mb-2" />
                            <p className="text-sm text-white font-medium">
                              Premium Content
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Content details */}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium truncate">{post.title}</h3>
                          <Badge className="ml-2 shrink-0">
                            ${post.price.toFixed(2)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.createdAt), "MMM d, yyyy")}
                          </span>
                          
                          {hasPurchased ? (
                            <Button size="sm" variant="outline" className="h-8">
                              View Content
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() => handlePurchase(post)}
                              disabled={purchaseMutation.isPending}
                            >
                              {purchaseMutation.isPending ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <ShoppingCart className="mr-1 h-3 w-3" />
                              )}
                              Purchase
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}