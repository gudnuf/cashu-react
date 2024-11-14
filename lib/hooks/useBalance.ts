import { useEffect, useState } from "react";
import { useProofStorageContext } from "./useContexts/useProofStorageContext";
import { Proof } from "@cashu/cashu-ts";
import { useWalletManager } from "./useWalletManager";

export const useBalance = () => {
  const proofStorage = useProofStorageContext();
  const walletManager = useWalletManager();

  const [balance, setBalance] = useState<number>();
  const [balanceByKeysetId, setBalanceByKeysetId] = useState<
    Record<string, number>
  >({});

  const calculateBalance = (proofs: Array<Proof>) => {
    let totalBalance = 0;
    const balanceByKeysetId = proofs.reduce((acc, p) => {
      if (!acc[p.id]) {
        acc[p.id] = 0;
      }
      acc[p.id] += p.amount;
      totalBalance += p.amount;
      return acc;
    }, {} as Record<string, number>);
    setBalance(totalBalance);
    setBalanceByKeysetId(balanceByKeysetId);
  };

  useEffect(() => {
    if (!walletManager.isLoaded) return;
    proofStorage.getProofs().then((proofs) => {
      calculateBalance(proofs);
    });
  }, [proofStorage, walletManager.isLoaded]);

  useEffect(() => {
    if (!walletManager.isLoaded) return;

    proofStorage.onProofsUpdated(calculateBalance);
    return () => {
      proofStorage.off(calculateBalance);
    };
  }, [proofStorage, walletManager.isLoaded]);

  return { balance, balanceByKeysetId };
};
