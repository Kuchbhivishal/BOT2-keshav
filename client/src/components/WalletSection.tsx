import { useEffect } from "react";
import { Transaction } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { useModal } from "@/context/modal-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function WalletSection() {
  const { user } = useAuth();
  const { transactions, isLoading } = useWallet();
  const { openWalletRecharge } = useModal();
  
  // Transactions to display
  const displayTransactions = transactions.slice(0, 5);
  
  if (!user) return null;
  
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your Wallet</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => openWalletRecharge()}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Funds
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
          <div className="text-2xl font-semibold">${user.walletBalance.toFixed(2)}</div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Recent Transactions</div>
            {transactions.length > 5 && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                View All
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
            </div>
          ) : displayTransactions.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {displayTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const { amount, type, description, createdAt } = transaction;
  const isPositive = amount > 0;
  
  // Determine icon based on transaction type
  const getIcon = () => {
    if (type === "deposit") {
      return <ArrowDown className="h-4 w-4 text-green-600" />;
    } else if (type === "withdrawal") {
      return <ArrowUp className="h-4 w-4 text-red-600" />;
    } else if (isPositive) {
      return <ArrowDown className="h-4 w-4 text-green-600" />;
    } else {
      return <ArrowUp className="h-4 w-4 text-red-600" />;
    }
  };
  
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/40">
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3">
          {getIcon()}
        </div>
        
        <div>
          <div className="text-sm font-medium truncate max-w-[150px]">
            {type === "deposit" ? "Added Funds" : description}
          </div>
          <div className="text-xs text-muted-foreground">
            {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : "Just now"}
          </div>
        </div>
      </div>
      
      <div className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? "+" : ""}{amount.toFixed(2)}
      </div>
    </div>
  );
}