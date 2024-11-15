import { useCallback, useEffect, useMemo, useState } from "react";
import { useWalletManagerContext } from "./useContexts/useWalletManagerContext";

export const useWalletManager = () => {
  const manager = useWalletManagerContext();
  const [wallets, setWallets] = useState(manager.wallets);

  useEffect(() => {
    /* Subscribe to wallet changes */
    const unsubscribe = manager.subscribeToWalletChanges((updatedWallets) => {
      setWallets(updatedWallets);
    });

    return () => {
      unsubscribe?.();
    };
  }, [manager]);

  const isLoaded = useMemo(() => {
    return manager.isLoaded;
  }, [manager.isLoaded]);

  const addMint = useCallback(
    async (mintUrl: string, units: Array<string>) => {
      return manager.addWallet(mintUrl, units);
    },
    [manager]
  );

  return {
    wallets,
    isLoaded,
    addMint,
  };
};
