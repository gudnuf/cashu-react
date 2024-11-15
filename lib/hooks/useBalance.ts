import { useEffect, useMemo, useState } from "react";
import { useWalletManager } from "./useWalletManager";
import { useWalletManagerContext } from "./useContexts/useWalletManagerContext";

export const useBalance = () => {
  const manager = useWalletManagerContext();
  const { wallets, isLoaded } = useWalletManager();

  const [balanceByWallet, setBalanceByWallet] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!isLoaded) return;

    const unsubscribe = manager.subscribeToBalanceChanges(
      (walletId, balance) => {
        setBalanceByWallet((prevBalances) => ({
          ...prevBalances,
          [walletId]: balance,
        }));
      }
    );

    return () => {
      unsubscribe?.();
    };
  }, [isLoaded, manager]);

  /* Initialize balances on load */
  useEffect(() => {
    if (!isLoaded) return;

    const initializeBalances = async () => {
      const walletBalances = await Promise.all(
        Array.from(wallets.values()).map(async (wallet) => {
          const walletBalance = await wallet.getBalance();
          return { id: wallet.id, balance: walletBalance };
        })
      );

      const balanceMap = walletBalances.reduce((acc, { id, balance }) => {
        acc[id] = balance;
        return acc;
      }, {} as Record<string, number>);

      setBalanceByWallet(balanceMap);
    };

    initializeBalances();
  }, [isLoaded, wallets]);

  const balance = useMemo(() => {
    const totalBalance = Object.values(balanceByWallet).reduce(
      (sum, balance) => sum + balance,
      0
    );
    return totalBalance;
  }, [balanceByWallet]);

  const balanceByUnit = useMemo(() => {
    return Object.entries(balanceByWallet).reduce((acc, [id, balance]) => {
      const wallet = wallets.get(id);
      if (!wallet) {
        console.warn("Wallet not found for id", id);
        return acc;
      }
      if (!acc[wallet.unit]) acc[wallet.unit] = 0;
      acc[wallet.unit] += balance;
      return acc;
    }, {} as Record<string, number>);
  }, [balanceByWallet, wallets]);

  return { balance, balanceByWallet, balanceByUnit };
};
