import { ReactNode, createContext, useContext } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@shared/schema";

interface WalletContextType {
  addFundsMutation: any;
  transactions: Transaction[];
  isLoading: boolean;
}

interface AddFundsParams {
  amount: number;
  paymentMethod: string;
}

export const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Get user transactions
  const { 
    data: transactions = [], 
    isLoading 
  } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return await res.json();
    }
  });
  
  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async (data: AddFundsParams) => {
      const res = await apiRequest("POST", "/api/wallet/add-funds", data);
      if (!res.ok) throw new Error("Failed to add funds");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add funds",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  return (
    <WalletContext.Provider value={{
      addFundsMutation,
      transactions,
      isLoading
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}