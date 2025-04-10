import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SimpleAuthPage() {
  const { user, isLoading, loginMutation, registerMutation, logoutMutation } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Clear error when switching modes
  useEffect(() => {
    setErrorMessage("");
  }, [registerMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setErrorMessage("Please fill in all fields");
      return;
    }
    
    try {
      setErrorMessage("");
      loginMutation.mutate({ username, password });
    } catch (error: any) {
      setErrorMessage(error.message || "Login failed");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !fullName || !email) {
      setErrorMessage("Please fill in all fields");
      return;
    }
    
    try {
      setErrorMessage("");
      registerMutation.mutate({ 
        username, 
        password, 
        fullName, 
        email,
        profilePicture: null
      });
    } catch (error: any) {
      setErrorMessage(error.message || "Registration failed");
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Test API calls
  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user");
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiResponse({ error: "Failed to fetch user" });
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiResponse({ error: "Failed to fetch transactions" });
    }
  };

  const fetchInfluencers = async () => {
    try {
      const response = await fetch("/api/influencers");
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiResponse({ error: "Failed to fetch influencers" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {user ? "Welcome, " + user.username : registerMode ? "Register" : "Login"}
        </h2>
        
        {!user ? (
          <>
            {errorMessage && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={registerMode ? handleRegister : handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="mt-1"
                />
              </div>
              
              {registerMode && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="mt-1"
                    />
                  </div>
                </>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || loginMutation.isPending || registerMutation.isPending}
              >
                {isLoading || loginMutation.isPending || registerMutation.isPending ? (
                  "Loading..."
                ) : (
                  registerMode ? "Register" : "Login"
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={() => setRegisterMode(!registerMode)}
              >
                {registerMode ? "Already have an account? Log in" : "Need an account? Register"}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium">User Information:</h3>
              <pre className="mt-2 text-sm whitespace-pre-wrap">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleLogout}>Logout</Button>
              <Button variant="outline" onClick={fetchUser}>Fetch User</Button>
              <Button variant="outline" onClick={fetchTransactions}>Fetch Transactions</Button>
              <Button variant="outline" onClick={fetchInfluencers}>Fetch Influencers</Button>
            </div>
            
            {apiResponse && (
              <div className="p-4 bg-gray-50 rounded mt-4">
                <h3 className="font-medium">API Response:</h3>
                <pre className="mt-2 text-sm whitespace-pre-wrap overflow-auto max-h-96">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}