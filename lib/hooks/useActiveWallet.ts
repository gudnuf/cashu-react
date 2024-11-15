import { useWalletManagerContext } from "./useContexts/useWalletManagerContext";
import { useCallback, useEffect, useState } from "react";
import { MintQuoteState } from "@cashu/cashu-ts";
import ExtCashuWallet from "../ExtCashuWallet";
import { logger } from "../logger";

export const useActiveWallet = () => {
  const manager = useWalletManagerContext();

  const [activeWallet, setActiveWalletState] = useState<
    ExtCashuWallet | undefined
  >();

  useEffect(() => {
    if (!manager.isLoaded) return;
    setActiveWalletState(manager.activeWallet);
  }, [manager.activeWallet, manager.isLoaded]);

  const setActiveWallet = useCallback(
    async (mintUrl: string, unit?: string) => {
      const wallet = await manager.setActiveWallet(mintUrl, unit);
      setActiveWalletState(wallet);
    },
    [manager]
  );

  const receiveLightning = useCallback(
    async (amount: number) => {
      if (!activeWallet) throw new Error("No active wallet set");

      const { invoice, checkingId } = await activeWallet.generateInvoice(
        amount
      );
      logger.info("invoice", invoice);
      let state;
      do {
        logger.debug("checking mint quote", checkingId);
        state = await activeWallet.tryToMintProofs(checkingId);
        if (state !== MintQuoteState.ISSUED) {
          /* wait 2 seconds before polling again */
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } while (state !== MintQuoteState.ISSUED);
    },
    [activeWallet]
  );

  return { receiveLightning, setActiveWallet, activeWallet };
};
