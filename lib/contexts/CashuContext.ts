import { Storage } from "../types";
import { createElement, createContext } from "react";
import WalletManager from "../WalletManager";
import { LocalStorageAdapter } from "../storage/LocalStorageAdapter";

let walletManager: WalletManager;

export const setupCashu = (
  storage?: Storage,
  get?: (key: string) => Promise<string | null>,
  put?: (key: string, value: string) => Promise<void>
) => {
  storage = storage || new LocalStorageAdapter();

  walletManager = new WalletManager(storage, get, put);

  walletManager.setLogLevel("debug");

  walletManager.load();
};

export const CashuContext = createContext<
  | {
      walletManager: WalletManager;
    }
  | undefined
>(undefined);

export type CashuContextProviderProps = object;

export const CashuProvider = (
  parameters: React.PropsWithChildren<CashuContextProviderProps>
) => {
  const { children } = parameters;

  if (!walletManager) {
    throw new Error(
      "You must call setupCashu before using the CashuWalletProvider."
    );
  }

  const props = { value: { walletManager } };

  return createElement(CashuContext.Provider, props, children);
};
