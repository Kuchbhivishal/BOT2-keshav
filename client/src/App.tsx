import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ModalProvider } from "@/context/modal-context";
import { WalletProvider } from "@/hooks/use-wallet";
import { ChatProvider } from "@/hooks/use-chat";
import { WalletRechargeModal } from "@/components/WalletRechargeModal";
import { VideoCallModal } from "@/components/VideoCallModal";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import InfluencerPage from "@/pages/influencer-page";
import { ProtectedRoute } from "@/lib/protected-route";
import BookingsPage from "@/pages/bookings-page";
import WalletPage from "@/pages/wallet-page";
import SimpleAuthPage from "@/pages/simple-auth-page";
import InfluencerDashboard from "@/pages/influencer-dashboard";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Basic landing component for non-authenticated users
const LandingPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-r from-indigo-500 to-purple-600">
      <header className="bg-white/10 p-4 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold text-white">Influencer Connect</div>
          <a href="/auth" className="rounded-full bg-white px-6 py-2 font-medium text-primary hover:bg-white/90">
            Sign in / Register
          </a>
        </div>
      </header>
      
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center text-white">
        <h1 className="mb-6 text-5xl font-bold">Connect with your favorite influencers</h1>
        <p className="mb-8 max-w-2xl text-xl">
          Chat directly, schedule video calls, and access exclusive content from top influencers in your industry.
        </p>
        <div className="flex gap-4">
          <a href="/auth" className="rounded-full bg-white px-8 py-3 font-medium text-primary hover:bg-white/90">
            Get Started
          </a>
          <a href="#features" className="rounded-full border border-white/70 px-8 py-3 font-medium text-white hover:bg-white/10">
            Learn More
          </a>
        </div>
        
        {/* Featured influencers section */}
        <div className="mt-20 w-full">
          <h2 className="mb-10 text-3xl font-bold">Featured Influencers</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((id) => (
              <div key={id} className="overflow-hidden rounded-xl bg-white/10 backdrop-blur-md">
                <div className="h-48 bg-gray-300/30"></div>
                <div className="p-5">
                  <h3 className="mb-1 text-xl font-semibold">Influencer {id}</h3>
                  <p className="mb-4 text-sm text-white/80">Fashion & Lifestyle</p>
                  <a 
                    href={`/i/influencer${id}`} 
                    className="block rounded-lg bg-white/20 p-2 text-center text-sm font-medium"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* How it works section */}
        <div id="features" className="mt-20 w-full">
          <h2 className="mb-10 text-3xl font-bold">How It Works</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-md">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">1</div>
              <h3 className="mb-2 text-xl font-semibold">Create an Account</h3>
              <p>Sign up and set up your profile to get started with our platform.</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-md">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">2</div>
              <h3 className="mb-2 text-xl font-semibold">Find Influencers</h3>
              <p>Browse our network of talented influencers across various categories.</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-md">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">3</div>
              <h3 className="mb-2 text-xl font-semibold">Connect & Collaborate</h3>
              <p>Chat, video call, or purchase exclusive content from your favorite influencers.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <ChatProvider>
            <ModalProvider>
              <AppRoutes />
              <WalletRechargeModal />
              <VideoCallModal />
              <Toaster />
            </ModalProvider>
          </ChatProvider>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Separate component for routes so we can use hooks like useAuth
function AppRoutes() {
  const { user, isLoading } = useAuth();
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <Switch>
      {/* Auth page - redirect to home if already logged in */}
      <Route path="/auth">
        {user ? <HomePage /> : <AuthPage />}
      </Route>
      
      {/* Simple auth page for testing */}
      <Route path="/simple-auth">
        <SimpleAuthPage />
      </Route>
      
      {/* Public influencer page that anyone can visit */}
      <Route path="/i/:handle">
        {({ handle }) => <InfluencerPage handle={handle} />}
      </Route>
      
      {/* Protected routes that require login */}
      <Route path="/bookings">
        {user ? <BookingsPage /> : <AuthPage />}
      </Route>
      
      <Route path="/wallet">
        {user ? <WalletPage /> : <AuthPage />}
      </Route>
      
      {/* Influencer dashboard */}
      <Route path="/influencer-dashboard">
        {user ? <InfluencerDashboard /> : <AuthPage />}
      </Route>
      
      {/* Dashboard route with influencer check */}
      <Route path="/dashboard">
        {user ? <DashboardRouter /> : <AuthPage />}
      </Route>
      
      {/* Root path - show home page for logged in users, landing page for others */}
      <Route path="/">
        {user ? <HomePage /> : <LandingPage />}
      </Route>
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

// Checks if user is an influencer and redirects to appropriate dashboard
function DashboardRouter() {
  const [isInfluencer, setIsInfluencer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const checkInfluencerStatus = async () => {
      try {
        const res = await fetch('/api/influencer/profile');
        if (res.ok) {
          setIsInfluencer(true);
        } else {
          setIsInfluencer(false);
        }
      } catch (err) {
        console.error('Error checking influencer status:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    checkInfluencerStatus();
  }, []);
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return <div className="p-8 text-center">Error checking account type. Please try again later.</div>;
  }
  
  // Redirect based on account type
  if (isInfluencer) {
    return <InfluencerDashboard />;
  } else {
    return <HomePage />;
  }
}

export default App;
