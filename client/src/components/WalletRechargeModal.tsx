import { useState } from "react";
import { useModal } from "@/context/modal-context";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Wallet, CreditCard, Building2 } from "lucide-react";

export function WalletRechargeModal() {
  const { walletRechargeOpen, closeWalletRecharge } = useModal();
  const { addFundsMutation } = useWallet();
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setAmount("");
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setAmount(numValue);
      }
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };

  const handleAddFunds = () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to add funds",
        variant: "destructive",
      });
      return;
    }

    if (amount === "" || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    addFundsMutation.mutate(
      { amount: Number(amount), paymentMethod },
      {
        onSuccess: () => {
          toast({
            title: "Funds added successfully",
            description: `$${amount.toFixed(2)} has been added to your wallet.`,
          });
          setAmount("");
          closeWalletRecharge();
        },
      }
    );
  };

  return (
    <Dialog
      open={walletRechargeOpen}
      onOpenChange={(open) => !open && closeWalletRecharge()}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Add Funds to Your Wallet
          </DialogTitle>
          <DialogDescription>
            Add funds to your wallet to chat with influencers, book calls, and
            purchase exclusive content.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-5 space-y-3">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
              className="text-lg"
            />

            <div className="grid grid-cols-4 gap-2 mt-2">
              {[10, 25, 50, 100].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={amount === value ? "default" : "outline"}
                  onClick={() => handleQuickAmount(value)}
                  className="text-center"
                >
                  ${value}
                </Button>
              ))}
            </div>
          </div>

          <Tabs
            defaultValue="card"
            onValueChange={setPaymentMethod}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="card" className="flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Card</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                <span>Bank</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Credit / Debit Card</CardTitle>
                  <CardDescription>
                    Add funds using your credit or debit card
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      placeholder="0000 0000 0000 0000"
                      disabled={addFundsMutation.isPending}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        disabled={addFundsMutation.isPending}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        disabled={addFundsMutation.isPending}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bank">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Bank Transfer</CardTitle>
                  <CardDescription>
                    Add funds directly from your bank account
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="account-name">Account Name</Label>
                    <Input
                      id="account-name"
                      placeholder="John Doe"
                      disabled={addFundsMutation.isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      placeholder="0000000000"
                      disabled={addFundsMutation.isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="routing-number">Routing Number</Label>
                    <Input
                      id="routing-number"
                      placeholder="000000000"
                      disabled={addFundsMutation.isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between items-center">
            {amount && (
              <div className="text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-semibold">${Number(amount).toFixed(2)}</span>
              </div>
            )}
            <Button
              onClick={handleAddFunds}
              disabled={!amount || addFundsMutation.isPending}
              className="min-w-[120px]"
            >
              {addFundsMutation.isPending ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <span>Add Funds</span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}