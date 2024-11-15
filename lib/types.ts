import { GetInfoResponse, MintKeys, MintKeyset } from "@cashu/cashu-ts";

export interface Mint {
  url: string;
  info: GetInfoResponse;
  keys: Array<MintKeys>;
  keysets: Array<MintKeyset>;
  nickname?: string;
}

export interface KeysetCounter {
  id: string;
  counter: number;
}

export interface HistoryToken {
  status: "pending" | "paid";
  token: string;
  amount: number;
  unit: string;
  date: Date;
}

export interface InvoiceHistoryItem {
  amount: number;
  bolt11: string;
  hash: string | null;
  memo: string | null;
  mint: string;
  quote: string;
  status: "paid" | "pending";
  unit: string;
}

export enum SchemaKey {
  MINTS = "cashu-react.mints",
  ACTIVE_UNIT = "cashu-react.activeUnit",
  ACTIVE_MINT_URL = "cashu-react.activeMintUrl",
  KEYSET_COUNTERS = "cashu-react.keysetCounters",
  HISTORY_TOKENS = "cashu-react.historyTokens",
  INVOICE_HISTORY = "cashu-react.invoiceHistory",
  VERSION = "cashu-react.version",
}

export interface Schema {
  [SchemaKey.MINTS]: Array<Mint>;
  [SchemaKey.ACTIVE_UNIT]: string | null;
  [SchemaKey.ACTIVE_MINT_URL]: string | null;
  [SchemaKey.KEYSET_COUNTERS]: Array<KeysetCounter>;
  [SchemaKey.HISTORY_TOKENS]: Array<HistoryToken>;
  [SchemaKey.INVOICE_HISTORY]: Array<InvoiceHistoryItem>;
  [SchemaKey.VERSION]: string;
}

export interface Storage {
  put<K extends SchemaKey>(key: K, value: Schema[K]): Promise<void>;

  get<K extends SchemaKey>(key: K): Promise<Schema[K]>;

  delete(key: SchemaKey): Promise<void>;
}
