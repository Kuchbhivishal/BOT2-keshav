import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { Influencer } from "@shared/schema";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import ProfileHeader from "@/components/ProfileHeader";
import ChatSection from "@/components/ChatSection";
import ContentFeedSection from "@/components/ContentFeedSection";
import BookingSection from "@/components/BookingSection";
import WalletSection from "@/components/WalletSection";
import { WalletProvider } from "@/hooks/use-wallet";
import { ChatProvider } from "@/hooks/use-chat";

interface InfluencerPageProps {
  handle?: string;
}

export default function InfluencerPage({ handle: propHandle }: InfluencerPageProps) {
  const { user } = useAuth();
  const params = useParams<{ handle: string }>();
  const [, navigate] = useLocation();
  
  // Use the handle from props or from URL params
  const handle = propHandle || params.handle;
  
  const { data: influencer, isLoading, error } = useQuery<Influencer>({
    queryKey: [`/api/influencers/${handle}`],
    enabled: !!handle,
  });
  
  // Redirect to home if influencer not found
  useEffect(() => {
    if (error) {
      navigate("/");
    }
  }, [error, navigate]);
  
  // We allow unauthenticated users to view the influencer page
  // They will just see a prompt to log in for interactive features
  
  return (
    <WalletProvider>
      <ChatProvider>
        <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
          {influencer && (
            <Helmet>
              <title>{influencer.fullName} | InfluConnect</title>
            </Helmet>
          )}
          
          <Sidebar />
          <MobileHeader />
          
          <main className="lg:ml-64 flex-1">
            <div className="container mx-auto px-4 py-6 max-w-6xl">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : influencer ? (
                <>
                  <ProfileHeader influencer={influencer} />
                  
                  {user ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <ChatSection influencer={influencer} />
                        <ContentFeedSection influencer={influencer} />
                      </div>
                      
                      <div>
                        <BookingSection influencer={influencer} />
                        <div className="mt-6">
                          <WalletSection />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-100">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Connect with {influencer.fullName}</h2>
                      <p className="text-gray-600 mb-6">
                        Sign in or create an account to chat, make bookings, or purchase exclusive content from {influencer.fullName}.
                      </p>
                      <div className="flex gap-4">
                        <a href="/auth" className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition">
                          Sign In / Register
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">Influencer Not Found</h2>
                  <p className="text-gray-500 mb-6">The influencer you're looking for doesn't exist or has been removed.</p>
                  <button 
                    onClick={() => navigate("/")}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                  >
                    Go Back Home
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </ChatProvider>
    </WalletProvider>
  );
}
