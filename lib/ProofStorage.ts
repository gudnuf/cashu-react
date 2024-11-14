import { Proof } from "@cashu/cashu-ts";
import { CashuStorageKey, Storage } from "./types";

export default class ProofStorage {
  private _listeners: Array<(proofs: Array<Proof>) => void> = [];

  constructor(private _storage: Storage) {}

  onProofsUpdated(listener: (proofs: Array<Proof>) => void): void {
    this._listeners.push(listener);
  }

  off(listener: (proofs: Array<Proof>) => void): void {
    this._listeners = this._listeners.filter((l) => l !== listener);
  }

  private _emitProofsUpdated(proofs: Array<Proof>): void {
    this._listeners.forEach((l) => l(proofs));
  }

  async getProofs() {
    return this._storage.get(CashuStorageKey.PROOFS);
  }

  async addProofs(proofs: Array<Proof>) {
    const currentProofs = await this._storage.get(CashuStorageKey.PROOFS);
    const newProofs = [...currentProofs, ...proofs];
    await this._storage.put(CashuStorageKey.PROOFS, newProofs);
    this._emitProofsUpdated(newProofs);
  }

  async deleteProofs(proofs: Array<Proof>) {
    const currentProofs = await this._storage.get(CashuStorageKey.PROOFS);
    const newProofs = currentProofs.filter((p) => !proofs.includes(p));
    await this._storage.put(CashuStorageKey.PROOFS, newProofs);
    this._emitProofsUpdated(newProofs);
  }

  async getProofsByKeysetId(keysetId: string) {
    const proofs = await this.getProofs();
    return proofs.filter((p) => p.id === keysetId);
  }
}
