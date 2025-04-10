import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { useModal } from "@/context/modal-context";
import { WalletProvider, useWallet } from "@/hooks/use-wallet";
import { Transaction } from "@shared/schema";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  MessageSquareIcon,
  VideoIcon,
  PhoneIcon,
  WalletIcon,
  LockIcon,
  PlusIcon,
  FilterIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2,
  Building,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function WalletPage() {
  return (
    <WalletProvider>
      <WalletPageContent />
    </WalletProvider>
  );
}

function WalletPageContent() {
  const { user } = useAuth();
  const { transactions, isLoading, addFundsMutation } = useWallet();
  const { openWalletRecharge } = useModal();
  const [filterType, setFilterType] = useState<string>("all");
  
  if (!user) return null;
  
  // Filter transactions based on type
  const filteredTransactions = filterType === "all" 
    ? transactions 
    : transactions.filter(transaction => transaction.type === filterType);
  
  // Group transactions by date for better display
  const groupedTransactions: Record<string, Transaction[]> = {};
  filteredTransactions.forEach(transaction => {
    const date = format(new Date(transaction.createdAt), 'yyyy-MM-dd');
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(transaction);
  });
  
  // Calculate wallet stats
  const getWalletStats = () => {
    const spent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const deposited = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { spent, deposited };
  };
  
  const { spent, deposited } = getWalletStats();
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <Helmet>
        <title>Wallet | InfluConnect</title>
      </Helmet>
      
      <Sidebar />
      <MobileHeader />
      
      <main className="lg:ml-64 flex-1">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="mb-6">
            <h1 className="text-2xl font-poppins font-bold text-gray-800">Your Wallet</h1>
            <p className="text-gray-600 mt-1">
              Manage your funds and view transaction history
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    View all your past transactions and payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Select
                        value={filterType}
                        onValueChange={setFilterType}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Transactions</SelectItem>
                          <SelectItem value="deposit">Deposits</SelectItem>
                          <SelectItem value="message">Messages</SelectItem>
                          <SelectItem value="audio">Audio Calls</SelectItem>
                          <SelectItem value="video">Video Calls</SelectItem>
                          <SelectItem value="content">Content Purchases</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="text-sm text-gray-500 flex items-center">
                        <FilterIcon className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Filter</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                        In
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                        Out
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-200"
                      >
                        <span>Export</span>
                      </Button>
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg">
                      <WalletIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <h3 className="text-lg font-medium text-gray-700 mb-1">No transactions yet</h3>
                      <p className="text-gray-500 mb-4">You haven't made any transactions of this type.</p>
                      <Button onClick={openWalletRecharge}>
                        Add Funds
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.keys(groupedTransactions).sort((a, b) => 
                        new Date(b).getTime() - new Date(a).getTime()
                      ).map(date => (
                        <div key={date}>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">
                            {format(new Date(date), 'MMMM d, yyyy')}
                          </h3>
                          <div className="space-y-1 bg-white rounded-lg border border-gray-100">
                            {groupedTransactions[date].map(transaction => (
                              <TransactionItem key={transaction.id} transaction={transaction} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="border-t-4 border-t-primary">
                <CardHeader className="pb-3">
                  <CardTitle>Wallet Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Available balance</p>
                      <p className="text-3xl font-bold text-primary">₹{user.walletBalance.toFixed(2)}</p>
                    </div>
                    <Button onClick={openWalletRecharge}>
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Funds
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Total Deposits</p>
                      <p className="text-xl font-semibold text-green-600">₹{deposited.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                      <p className="text-xl font-semibold text-red-600">₹{spent.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Recharge</CardTitle>
                  <CardDescription>
                    Add funds to your wallet quickly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[100, 200, 500].map(amount => (
                        <button
                          key={amount}
                          className="border border-gray-200 rounded-lg p-3 text-center hover:bg-gray-50 transition"
                          onClick={() => openWalletRecharge()}
                        >
                          <span className="font-medium">₹{amount}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <Input
                        placeholder="Enter amount"
                        type="number"
                        min="1"
                        className="pl-8"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">₹</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={openWalletRecharge}
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-3 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Building className="text-blue-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">UPI Payment</p>
                        <p className="text-xs text-gray-500">Pay using UPI apps like PhonePe, GPay</p>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-3 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <CreditCard className="text-indigo-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-xs text-gray-500">Pay using credit or debit card</p>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-3 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                        <WalletIcon className="text-yellow-600 text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Digital Wallet</p>
                        <p className="text-xs text-gray-500">Pay using digital wallets</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  // Determine icon and color based on transaction type
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'message':
        return {
          icon: <MessageSquareIcon className="text-red-500 text-xs" />,
          bgColor: 'bg-red-100'
        };
      case 'video':
        return {
          icon: <VideoIcon className="text-blue-500 text-xs" />,
          bgColor: 'bg-blue-100'
        };
      case 'audio':
        return {
          icon: <PhoneIcon className="text-blue-500 text-xs" />,
          bgColor: 'bg-blue-100'
        };
      case 'deposit':
        return {
          icon: <WalletIcon className="text-green-500 text-xs" />,
          bgColor: 'bg-green-100'
        };
      case 'content':
        return {
          icon: <LockIcon className="text-purple-500 text-xs" />,
          bgColor: 'bg-purple-100'
        };
      default:
        return {
          icon: <WalletIcon className="text-gray-500 text-xs" />,
          bgColor: 'bg-gray-100'
        };
    }
  };
  
  const { icon, bgColor } = getTransactionIcon();
  const isPositive = transaction.amount > 0;
  
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition border-b last:border-b-0 border-gray-100">
      <div className="flex items-center">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mr-3", bgColor)}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{transaction.description}</p>
          <p className="text-xs text-gray-500">{format(new Date(transaction.createdAt), 'h:mm a')}</p>
        </div>
      </div>
      <div className={cn(
        "font-medium",
        isPositive ? "text-green-500" : "text-red-500"
      )}>
        {isPositive ? '+' : ''}{transaction.amount.toFixed(0)}
      </div>
    </div>
  );
}
