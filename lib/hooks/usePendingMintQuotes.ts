import { useEffect, useState } from "react";
import { InvoiceHistoryItem } from "../types";
import { useWalletManager } from "./useWalletManager";
import { useWalletManagerContext } from "./useContexts/useWalletManagerContext";
import { logger } from "../logger";

export const usePendingMintQuotes = () => {
  const { isLoaded, wallets } = useWalletManager();
  const manager = useWalletManagerContext();

  const [pendingMintQuotes, setPendingMintQuotes] = useState<
    InvoiceHistoryItem[]
  >([]);

  /* initialize pendingMintQuotes */
  useEffect(() => {
    if (!isLoaded) return;
  }, [isLoaded, wallets]);

  useEffect(() => {
    if (!isLoaded) return;

    /* Get initial pending quotes from all wallets */
    const loadPendingQuotes = async () => {
      const quotesMap = new Map<string, InvoiceHistoryItem>();
      for (const wallet of wallets.values()) {
        const walletQuotes = await wallet.getPendingMintQuotes();
        walletQuotes.forEach((quote) => {
          quotesMap.set(quote.quote, quote);
        });
      }
      setPendingMintQuotes(Array.from(quotesMap.values()));
    };
    loadPendingQuotes();

    /* Subscribe to quote changes using WalletManager */
    const unsubscribe = manager.subscribePendingMintQuote((quotes) => {
      if (quotes.length === 0) setPendingMintQuotes([]);

      setPendingMintQuotes((prev) => {
        const uniqueQuotes = new Map<string, InvoiceHistoryItem>();

        /* Add existing quotes that aren't being updated */
        prev.forEach((quote) => {
          if (!quotes.some((newQ) => newQ.quote === quote.quote)) {
            uniqueQuotes.set(quote.quote, quote);
          }
        });

        /* Add new quotes */
        quotes.forEach((quote) => {
          uniqueQuotes.set(quote.quote, quote);
        });

        return Array.from(uniqueQuotes.values());
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [isLoaded, manager, wallets]);

  const checkMintQuote = async (quoteId: string) => {
    const quote = pendingMintQuotes.find((q) => q.quote === quoteId);
    if (!quote) {
      throw new Error(`No quote found for quoteId ${quoteId}`);
    }
    const wallet = wallets.get(`${quote.mint}-${quote.unit}`);
    if (!wallet) {
      throw new Error(`No wallet found for quote ${quoteId}`);
    }
    const state = await wallet.tryToMintProofs(quoteId);
    logger.debug(`checkMintQuote ${quoteId} state`, state);
  };

  return { pendingMintQuotes, checkMintQuote };
};
