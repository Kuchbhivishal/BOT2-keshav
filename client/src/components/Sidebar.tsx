import { Link, useLocation } from "wouter";
import { Home, Users, Calendar, Wallet, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useModal } from "@/context/modal-context";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { openWalletRecharge } = useModal();
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  const menuItems = [
    { label: "Home", icon: <Home className="h-5 w-5" />, href: "/" },
    { label: "Dashboard", icon: <Users className="h-5 w-5" />, href: "/dashboard" },
    { label: "Bookings", icon: <Calendar className="h-5 w-5" />, href: "/bookings" },
    { label: "Wallet", icon: <Wallet className="h-5 w-5" />, href: "/wallet" },
  ];
  
  if (!user) return null;
  
  return (
    <div className="hidden h-screen w-64 flex-col border-r bg-white md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-xl font-bold text-primary cursor-pointer" onClick={() => window.location.href = "/"}>
          InfluencerConnect
        </span>
      </div>
      
      <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <div key={item.label} className="w-full">
                <Link href={item.href}>
                  <div
                    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-muted"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>
        
        <div className="space-y-4 pt-4">
          {/* User profile and wallet section */}
          <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-primary/10">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.fullName || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-sm font-medium">
                      {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.username}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email || user.username}
                </p>
              </div>
            </div>
            
            <div className="mt-4 border-t pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Wallet Balance</span>
                <span className="font-medium">₹{user.walletBalance?.toFixed(2) || "0.00"}</span>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => openWalletRecharge()}
              >
                Add Funds
              </Button>
            </div>
          </div>
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}