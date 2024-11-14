import { GetInfoResponse, MintKeys, MintKeyset, Proof } from "@cashu/cashu-ts";

export enum CashuStorageKey {
  MINTS = "cashu-react.mints",
  ACTIVE_UNIT = "cashu-react.activeUnit",
  ACTIVE_MINT_URL = "cashu-react.activeMintUrl",
  PROOFS = "cashu-react.proofs",
  SPENT_PROOFS = "cashu-react.spentProofs",
  KEYSET_COUNTERS = "cashu-react.keysetCounters",
  HISTORY_TOKENS = "cashu-react.historyTokens",
  INVOICE_HISTORY = "cashu-react.invoiceHistory",
  VERSION = "cashu-react.version",
}

export type CashuStorageKeys = {
  [CashuStorageKey.MINTS]: Array<{
    url: string;
    info: GetInfoResponse;
    keys: Array<MintKeys>;
    keysets: Array<MintKeyset>;
    nickname?: string;
  }>;
  [CashuStorageKey.ACTIVE_UNIT]: string | null;
  [CashuStorageKey.ACTIVE_MINT_URL]: string | null;
  [CashuStorageKey.PROOFS]: Array<Proof>;
  [CashuStorageKey.SPENT_PROOFS]: Array<Proof>;
  [CashuStorageKey.KEYSET_COUNTERS]: Array<{ id: string; counter: number }>;
  [CashuStorageKey.HISTORY_TOKENS]: Array<{
    status: "pending" | "paid";
    token: string;
    amount: number;
    unit: string;
    date: Date;
  }>;
  [CashuStorageKey.INVOICE_HISTORY]: Array<{
    amount: number;
    bolt11: string;
    hash: string;
    memo: string;
    mint: string;
    quote: string;
    status: "paid" | "pending";
    unit: string;
  }>;
  [CashuStorageKey.VERSION]: string;
};

export interface Storage {
  put<K extends CashuStorageKey>(
    key: K,
    value: CashuStorageKeys[K]
  ): Promise<void>;

  get<K extends CashuStorageKey>(key: K): Promise<CashuStorageKeys[K]>;

  delete(key: CashuStorageKey): Promise<void>;
}
