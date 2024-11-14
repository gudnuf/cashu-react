import { useCallback, useEffect } from "react";
import { useProofStorageContext } from "./useContexts/useProofStorageContext";
import { useWalletManager } from "./useWalletManager";

export const useActiveWallet = () => {
  const proofStorage = useProofStorageContext();
  const { activeWallet } = useWalletManager();

  useEffect(() => {
    console.log("activeWallet", activeWallet);
    return () => {};
  }, [activeWallet]);

  const receiveLightning = useCallback(
    async (amount: number, unit?: string) => {
      if (!activeWallet) throw new Error("No active wallet set");

      if (unit && !activeWallet.keysets.find((k) => k.unit === unit)) {
        throw new Error(`No keyset for unit ${unit}`);
      } else if (unit) {
        // activeWallet.unit = unit;
        // activeWallet.se;
      }

      const mintQuote = await activeWallet.createMintQuote(amount);

      console.log(mintQuote);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const { proofs } = await activeWallet.mintProofs(amount, mintQuote.quote);

      await proofStorage.addProofs(proofs);
    },
    [activeWallet, proofStorage]
  );

  return { receiveLightning };
};
