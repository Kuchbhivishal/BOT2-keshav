import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, Home, Users, Calendar, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

export default function MobileHeader() {
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setOpen(false);
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  const menuItems = [
    { label: "Home", icon: <Home className="mr-2 h-4 w-4" />, href: "/" },
    { label: "Dashboard", icon: <Users className="mr-2 h-4 w-4" />, href: "/dashboard" },
    { label: "Bookings", icon: <Calendar className="mr-2 h-4 w-4" />, href: "/bookings" },
    { label: "Wallet", icon: <Wallet className="mr-2 h-4 w-4" />, href: "/wallet" },
  ];
  
  return (
    <div className="sticky top-0 z-50 border-b bg-white px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-primary cursor-pointer" onClick={() => window.location.href = "/"}>
          InfluencerConnect
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] p-0 pt-10">
            <div className="flex h-full flex-col">
              <div className="px-4 py-2">
                {user && (
                  <div className="mb-6">
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="mt-2 text-sm">
                      Wallet: <span className="font-semibold">${user.walletBalance.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <nav className="flex flex-col space-y-1">
                  {menuItems.map((item) => (
                    <div 
                      key={item.label} 
                      className="flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setOpen(false);
                        window.location.href = item.href;
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </div>
                  ))}
                  
                  {user && (
                    <button
                      className="flex items-center rounded-md px-2 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  )}
                </nav>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}