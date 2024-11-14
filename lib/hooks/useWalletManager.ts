import { useCallback, useState } from "react";
import { useWalletManagerContext } from "./useContexts/useWalletManagerContext";
import { CashuWallet } from "@cashu/cashu-ts";

export const useWalletManager = () => {
  const [activeWallet, setActiveWalletState] = useState<
    CashuWallet | undefined
  >();
  const walletManager = useWalletManagerContext();

  const addMint = useCallback(
    async (mintUrl: string, units: Array<string>) => {
      return walletManager.addWallet(mintUrl, units);
    },
    [walletManager]
  );

  const setActiveWallet = useCallback(
    async (mintUrl: string, unit?: string) => {
      const wallet = await walletManager.setActiveWallet(mintUrl, unit);
      setActiveWalletState(wallet);
    },
    [walletManager]
  );

  return {
    addMint,
    wallets: walletManager.wallets,
    activeWallet,
    setActiveWallet,
    isLoaded: walletManager.isLoaded,
    activeUnit: walletManager.activeWallet?.unit,
  };
};
