import {
  CashuMint,
  CashuWallet,
  GetInfoResponse,
  MintKeys,
  MintKeyset,
  MintQuoteState,
} from "@cashu/cashu-ts";
import { Storage, SchemaKey, InvoiceHistoryItem } from "./types";
import { BrowserLocker, CashuLocalStorage } from "@gudnuf/cornucopia";
import { EventEmitter } from "eventemitter3";
import { logger } from "./logger";

export default class ExtCashuWallet extends CashuWallet {
  private _balanceChangeEmitter = new EventEmitter();
  private _mintQuoteChangeEmitter = new EventEmitter();
  private _proofStorage: CashuLocalStorage;
  private _storage: Storage;

  constructor(
    storage: Storage,
    mint: CashuMint,
    unit: string,
    options?: {
      keys?: Array<MintKeys> | MintKeys;
      keysets?: Array<MintKeyset>;
      mintInfo?: GetInfoResponse;
      bip39seed?: Uint8Array;
      denominationTarget?: number;
    }
  ) {
    super(mint, { ...options, unit });

    const locker = new BrowserLocker(
      `proof-locks_${this.mint.mintUrl}-${this.unit}`
    );
    this._proofStorage = new CashuLocalStorage(
      this.mint.mintUrl,
      this.unit,
      locker
    );

    this._storage = storage;
  }

  get id() {
    return `${this.mint.mintUrl}-${this.unit}`;
  }

  async getBalance() {
    return this._proofStorage.getBalance();
  }

  onBalanceChange(listener: (balance: number) => void) {
    this._balanceChangeEmitter.on("balanceChange", listener);
  }

  offBalanceChange(listener: (balance: number) => void) {
    this._balanceChangeEmitter.off("balanceChange", listener);
  }

  onMintQuoteChange(listener: (quotes: InvoiceHistoryItem[]) => void) {
    this._mintQuoteChangeEmitter.on("mintQuoteChange", listener);
  }

  offMintQuoteChange(listener: (quotes: InvoiceHistoryItem[]) => void) {
    this._mintQuoteChangeEmitter.off("mintQuoteChange", listener);
  }

  async getPendingMintQuotes(): Promise<InvoiceHistoryItem[]> {
    const history = await this._storage.get(SchemaKey.INVOICE_HISTORY);
    return history.filter((quote) => quote.status === "pending");
  }

  async generateInvoice(
    amount: number,
    description?: string
  ): Promise<{ invoice: string; checkingId: string }> {
    const mintQuote = await this.createMintQuote(amount, description);

    const prevHistory = await this._storage.get(SchemaKey.INVOICE_HISTORY);

    const history: Array<InvoiceHistoryItem> = [
      ...prevHistory,
      {
        amount,
        bolt11: mintQuote.request,
        hash: null,
        memo: null,
        mint: this.mint.mintUrl,
        quote: mintQuote.quote,
        status: "pending",
        unit: this.unit,
      },
    ];

    await this._storage.put(SchemaKey["INVOICE_HISTORY"], history);

    /* Emit updated pending quotes */
    const pendingQuotes = await this.getPendingMintQuotes();
    this._mintQuoteChangeEmitter.emit("mintQuoteChange", pendingQuotes);

    return { invoice: mintQuote.request, checkingId: mintQuote.quote };
  }

  async tryToMintProofs(quoteId: string) {
    const pendingTx = (await this._storage.get(SchemaKey.INVOICE_HISTORY)).find(
      (x) => x.quote === quoteId
    );
    if (!pendingTx)
      throw new Error(`No pending transaction for quote ${quoteId}`);
    if (pendingTx.status !== "pending")
      throw new Error(`Transaction for quote ${quoteId} is not pending`);

    const { state } = await this.checkMintQuote(quoteId);

    logger.debug("mintQuoteState", state);

    if (state === MintQuoteState.UNPAID) {
      /* invoice not paid */
      // if (isMintQuoteExpired(pendingQuote)) {
      //   /* only check expired if its UNPAID */
      //   // dispatch(deleteLightningTransaction(quoteId));

      //   return "EXPIRED";
      // } else {
      //   return state;
      // }
      return state;
    } else if (state === MintQuoteState.ISSUED) {
      /* this shouldn't happen if we successfully remove the quote after minting */
      logger.warn("Mint quote already issued");
      // removePendingMintQuote(quoteId);
      return state;
    } else if (state === MintQuoteState.PAID) {
      /* invoice was paid, mint proofs */
      const { proofs } = await this.mintProofs(pendingTx.amount, quoteId);
      /* claim new proofs */

      await this._proofStorage.receiveProofs(proofs);
      const newBalance = await this.getBalance();
      this._balanceChangeEmitter.emit("balanceChange", newBalance);

      /* update history */
      pendingTx.status = "paid";
      const history = (await this._storage.get(SchemaKey.INVOICE_HISTORY)).map(
        (x) => {
          if (x.quote === quoteId) {
            return pendingTx;
          } else {
            return x;
          }
        }
      );
      await this._storage.put(SchemaKey.INVOICE_HISTORY, history);

      /* Emit updated pending quotes */
      const pendingQuotes = await this.getPendingMintQuotes();
      this._mintQuoteChangeEmitter.emit("mintQuoteChange", pendingQuotes);

      /* quote is now ISSUED */
      return MintQuoteState.ISSUED;
    } else {
      throw new Error("Invalid mint quote state");
    }
  }
}
