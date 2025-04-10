import React, { createContext, useContext, useState, ReactNode } from "react";
import { Influencer } from "@shared/schema";
import { WalletRechargeModal } from "@/components/WalletRechargeModal";
import { VideoCallModal } from "@/components/VideoCallModal";

interface VideoCallState {
  isOpen: boolean;
  influencer: Influencer | null;
  callType: "audio" | "video";
  duration: number;
  cost: number;
}

interface ModalContextType {
  // Wallet modal
  walletRechargeOpen: boolean;
  openWalletRecharge: () => void;
  closeWalletRecharge: () => void;
  
  // Video call modal
  videoCallState: VideoCallState;
  openVideoCall: (params: {
    influencer: Influencer;
    callType: "audio" | "video";
    duration: number;
    cost: number;
  }) => void;
  closeVideoCall: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const initialVideoCallState: VideoCallState = {
  isOpen: false,
  influencer: null,
  callType: "video",
  duration: 0,
  cost: 0,
};

export function ModalProvider({ children }: { children: ReactNode }) {
  // Wallet recharge modal state
  const [walletRechargeOpen, setWalletRechargeOpen] = useState(false);
  
  // Video call modal state
  const [videoCallState, setVideoCallState] = 
    useState<VideoCallState>(initialVideoCallState);
  
  // Wallet modal functions
  const openWalletRecharge = () => setWalletRechargeOpen(true);
  const closeWalletRecharge = () => setWalletRechargeOpen(false);
  
  // Video call modal functions
  const openVideoCall = ({ 
    influencer, 
    callType, 
    duration, 
    cost 
  }: {
    influencer: Influencer;
    callType: "audio" | "video";
    duration: number;
    cost: number;
  }) => {
    setVideoCallState({
      isOpen: true,
      influencer,
      callType,
      duration,
      cost
    });
  };
  
  const closeVideoCall = () => {
    setVideoCallState(initialVideoCallState);
  };
  
  return (
    <ModalContext.Provider
      value={{
        walletRechargeOpen,
        openWalletRecharge,
        closeWalletRecharge,
        videoCallState,
        openVideoCall,
        closeVideoCall,
      }}
    >
      {children}
      
      {/* Modals */}
      <WalletRechargeModal />
      <VideoCallModal />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}