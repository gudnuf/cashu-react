import { CashuMint } from "@cashu/cashu-ts";
import ExtCashuWallet from "./ExtCashuWallet";
import { Storage, SchemaKey, InvoiceHistoryItem } from "./types";
import { logger, type LogLevel } from "./logger";
import { EventEmitter } from "eventemitter3";
import {
  BrowserLocker,
  CashuKeyValueStore,
  CashuStorage as CornucopiaStorage,
  StartProofSelection,
} from "@gudnuf/cornucopia";

const DEFAULT_UNIT = "sat"; // TODO: make this configurable

const initDB = async (storage: Storage, version: string) => {
  await Promise.all([
    storage.put(SchemaKey.VERSION, version),
    storage.put(SchemaKey.MINTS, []),
    storage.put(SchemaKey.ACTIVE_UNIT, DEFAULT_UNIT),
    storage.put(SchemaKey.ACTIVE_MINT_URL, ""),
    storage.put(SchemaKey.KEYSET_COUNTERS, []),
    storage.put(SchemaKey.HISTORY_TOKENS, []),
    storage.put(SchemaKey.INVOICE_HISTORY, []),
  ]);
};

export default class CashuWalletManager {
  private _storage: Storage;
  private _wallets: Map<string, Map<string, ExtCashuWallet>> = new Map(
    new Map()
  ); // mintUrl -> unit -> wallet
  private _activeWallet: ExtCashuWallet | undefined;
  private _activeUnit: string = DEFAULT_UNIT;
  private _walletsChangeEmitter = new EventEmitter();

  private _isLoaded = false;
  private _loadPromise: Promise<void> | undefined = undefined;
  private _resolveLoad: () => void = () => {};

  constructor(
    storage: Storage,
    private _get?: (key: string) => Promise<string | null>,
    private _put?: (key: string, value: string) => Promise<void>
  ) {
    this._loadPromise = new Promise((resolve) => {
      this._resolveLoad = resolve;
    });
    this._storage = storage;
  }

  get isLoaded() {
    return this._isLoaded;
  }

  /* Get all wallets for a specific mint URL */
  getWalletsByMint(mintUrl: string): Map<string, ExtCashuWallet> | undefined {
    return this._wallets.get(mintUrl);
  }

  /* Get all available mint URLs */
  get availableMints(): Array<string> {
    return Array.from(this._wallets.keys());
  }

  /* Get all available units across all mints */
  get availableUnits(): Array<string> {
    const units = new Set<string>();
    this._wallets.forEach((unitWallets) => {
      unitWallets.forEach((wallet) => {
        units.add(wallet.unit || DEFAULT_UNIT);
      });
    });
    return Array.from(units);
  }

  /* Get all wallets for a specific unit across all mints */
  getWalletsByUnit(unit: string): Map<string, ExtCashuWallet> {
    const wallets = new Map<string, ExtCashuWallet>();
    this._wallets.forEach((unitWallets, mintUrl) => {
      const wallet = unitWallets.get(unit);
      if (wallet) {
        wallets.set(mintUrl, wallet);
      }
    });
    return wallets;
  }

  subscribeToBalanceChanges(
    listener: (walletId: string, balance: number) => void
  ) {
    /* Check if wallets exist before iterating */
    if (!this._isLoaded) return;
    /* Create array of cleanup functions */
    const cleanupFns: Array<() => void> = [];

    this._wallets.forEach((unitWallets, mintUrl) => {
      if (!unitWallets) return;

      unitWallets.forEach((wallet, unit) => {
        const handleBalanceChange = (balance: number) => {
          listener(`${mintUrl}-${unit}`, balance);
        };

        wallet.onBalanceChange(handleBalanceChange);
        cleanupFns.push(() => {
          wallet.offBalanceChange(handleBalanceChange);
        });
      });
    });

    /* Return unsubscribe function that calls all cleanups */
    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }

  subscribePendingMintQuote(listener: (quote: InvoiceHistoryItem[]) => void) {
    if (!this._isLoaded) return;

    const handlePendingMintQuote = (quote: InvoiceHistoryItem[]) => {
      listener(quote);
    };

    this._wallets.forEach((unitWallets) => {
      if (!unitWallets) return;

      unitWallets.forEach((wallet) => {
        wallet.onMintQuoteChange(handlePendingMintQuote);
      });
    });

    return () => {
      this._wallets.forEach((unitWallets) => {
        if (!unitWallets) return;

        unitWallets.forEach((wallet) => {
          wallet.offMintQuoteChange(handlePendingMintQuote);
        });
      });
    };
  }

  /* Subscribe to wallet list changes */
  subscribeToWalletChanges(
    listener: (wallets: Map<string, ExtCashuWallet>) => void
  ) {
    this._walletsChangeEmitter.on("walletsChange", listener);
    return () => {
      this._walletsChangeEmitter.off("walletsChange", listener);
    };
  }

  private _getWalletKey(mintUrl: string, unit: string): string {
    return `${mintUrl}-${unit}`;
  }

  /* Get all wallets flattened into a single map of mintUrl -> wallet */
  get wallets(): Map<string, ExtCashuWallet> {
    const allWallets = new Map<string, ExtCashuWallet>();
    this._wallets.forEach((unitWallets, mintUrl) => {
      unitWallets.forEach((wallet, unit) => {
        const key = this._getWalletKey(mintUrl, unit);
        allWallets.set(key, wallet);
      });
    });
    return allWallets;
  }

  get activeWallet() {
    return this._activeWallet;
  }

  async waitForLoad() {
    if (this._isLoaded) return Promise.resolve();
    return this._loadPromise;
  }

  async load() {
    if (this._isLoaded) return;

    // TODO - get actual version from package.json
    const pkgVersion = "0.0.0 ";
    // use storage directly because version may not be defined
    const currentVersion = await this._storage
      .get(SchemaKey.VERSION)
      .catch(() => undefined);

    if (!currentVersion) {
      await initDB(this._storage, pkgVersion);
    }

    const acitveUnit = await this._storage.get(SchemaKey.ACTIVE_UNIT);
    const activeMintUrl = await this._storage.get(SchemaKey.ACTIVE_MINT_URL);

    const mints = await this._storage.get(SchemaKey.MINTS);

    mints.forEach(({ url, info, keys, keysets }) => {
      const mint = new CashuMint(url);

      // TODO: refetch mint info and check if keys are still active

      /* Group keysets by unit */
      const keysetsByUnit = keysets.reduce((acc, keyset) => {
        if (!acc.has(keyset.unit)) {
          acc.set(keyset.unit, []);
        }
        acc.get(keyset.unit)!.push(keyset);
        return acc;
      }, new Map<string, typeof keysets>());

      /* Initialize mint map if it doesn't exist */
      if (!this._wallets.has(url)) {
        this._wallets.set(url, new Map());
      }

      /* Create a wallet for each unit */
      keysetsByUnit.forEach((unitKeysets, unit) => {
        const locker = new BrowserLocker(`proof-locks_${mint.mintUrl}-${unit}`);
        let proofStorage: CornucopiaStorage<StartProofSelection> | undefined;
        if (this._get && this._put) {
          proofStorage = new CashuKeyValueStore(
            mint.mintUrl,
            unit,
            locker,
            this._get,
            this._put
          );
        }
        const wallet = new ExtCashuWallet(this._storage, mint, unit, {
          keys,
          keysets: unitKeysets,
          mintInfo: info,
          storage: proofStorage,
        });

        wallet.getKeys();

        logger.info("loaded wallet", wallet);

        /* Add wallet to mint's unit map */
        this._wallets.get(url)!.set(unit, wallet);
      });
    });

    if (activeMintUrl && acitveUnit) {
      await this.setActiveWallet(activeMintUrl, acitveUnit);
    }

    this._isLoaded = true;
    this._resolveLoad();

    /* Emit initial wallets state */
    this._walletsChangeEmitter.emit("walletsChange", this.wallets);
  }

  async addWallet(mintUrl: string, units: Array<string>) {
    const mint = new CashuMint(mintUrl);
    const keysets = await mint.getKeySets();
    const unitKeysets = keysets.keysets.filter((k) => units?.includes(k.unit));

    const keys = await Promise.all(
      unitKeysets.map(async (k) => {
        const keys = await mint.getKeys(k.id);
        return keys.keysets[0];
      })
    );

    /* Initialize mint map if it doesn't exist */
    if (!this._wallets.has(mintUrl)) {
      this._wallets.set(mintUrl, new Map());
    }

    /* Group keysets by unit */
    const keysetsByUnit = unitKeysets.reduce((acc, keyset) => {
      if (!acc.has(keyset.unit)) {
        acc.set(keyset.unit, []);
      }
      acc.get(keyset.unit)!.push(keyset);
      return acc;
    }, new Map<string, typeof unitKeysets>());

    const mintInfo = await mint.getInfo();

    /* Create a wallet for each supported unit */
    keysetsByUnit.forEach((unitKeysets, unit) => {
      const wallet = new ExtCashuWallet(this._storage, mint, unit, {
        keys,
        keysets: unitKeysets,
        mintInfo,
      });

      wallet.getKeys();

      /* Add wallet to mint's unit map */
      this._wallets.get(mintUrl)!.set(unit, wallet);
    });

    /* Update storage with new mint data */
    await this._storage.put(SchemaKey.MINTS, [
      ...(await this._storage.get(SchemaKey.MINTS)),
      {
        url: mintUrl,
        info: mintInfo,
        keysets: unitKeysets,
        keys,
      },
    ]);

    /* Set active wallet if none is set */
    if (!this._activeWallet) {
      const firstUnit = Array.from(keysetsByUnit.keys())[0];
      await this.setActiveWallet(mintUrl, firstUnit);
    }

    /* Emit updated wallets */
    this._walletsChangeEmitter.emit("walletsChange", this.wallets);
  }

  setActiveWallet = async (
    mintUrl: string,
    unit: string = this._activeUnit
  ) => {
    const wallet = this._wallets.get(mintUrl)?.get(unit);
    if (!wallet) throw new Error(`No wallet found for ${mintUrl} and ${unit}`);
    this._activeWallet = wallet;
    await this._storage.put(SchemaKey.ACTIVE_MINT_URL, mintUrl);
    await this._storage.put(SchemaKey.ACTIVE_UNIT, unit);
    return this._activeWallet;
  };

  /**
   * Sets the log level for the library.
   * @param level The desired log level ('DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE').
   */
  setLogLevel(level: LogLevel) {
    logger.setLevel(level);
    logger.info(`Log level set to ${level}.`);
  }
}
