import { Storage } from "../types";
import { createElement, createContext } from "react";
import WalletManager from "../WalletManager";
import ProofStorage from "../ProofStorage";
import { LocalStorageAdapter } from "../storage/LocalStorageAdapter";

let walletManager: WalletManager;
let proofStorage: ProofStorage;

export const setupCashu = (storage?: Storage) => {
  storage = storage || new LocalStorageAdapter();

  walletManager = new WalletManager(storage);

  walletManager.load();

  proofStorage = new ProofStorage(storage);
};

export const CashuContext = createContext<
  | {
      walletManager: WalletManager;
      proofStorage: ProofStorage;
    }
  | undefined
>(undefined);

export type CashuContextProviderProps = object;

export const CashuProvider = (
  parameters: React.PropsWithChildren<CashuContextProviderProps>
) => {
  const { children } = parameters;

  if (!walletManager || !proofStorage) {
    throw new Error(
      "You must call setupCashu before using the CashuWalletProvider."
    );
  }

  const props = { value: { walletManager, proofStorage } };

  return createElement(CashuContext.Provider, props, children);
};
