import { type ICommitment } from '@privacy-pool-v1/core-ts/account/interfaces';
import { type TCommitment } from '@privacy-pool-v1/core-ts/account/types';
import { type IPrivacyKey } from '@privacy-pool-v1/core-ts/account/interfaces';
import { type Signature, type Ciphertext } from 'maci-crypto';

import { FnCommitment } from '@privacy-pool-v1/core-ts/account/functions';
import { PubKey } from 'maci-domainobjs';

// Useful aliases
export type Commitment = ICommitment.CommitmentI;
export function CreateCommitment(
  key: IPrivacyKey.KeyI,
  secrets: TCommitment.SecretsT,
  index?: bigint,
): Commitment {
  return CCommitment.CommitmentC.create(key, secrets, index);
}

export namespace CCommitment {
  export class CommitmentC implements ICommitment.CommitmentI {
    static readonly SECRET_LEN: number = 2;
    _exhausted: boolean = false;

    private _secrets: TCommitment.SecretsT;
    private _key: IPrivacyKey.KeyI;

    // this nullifier is only valid
    // when commitment is non-zero (isDummy) &&:
    // - if the index is true leaf index in the commitment tree
    // - && the nullifier is not yet known (_exhausted)
    // Otherwise valid when commitment is zero (!isDummy)
    public _index: bigint = 0n;
    public _nonce: bigint = 0n;

    constructor(key: IPrivacyKey.KeyI, secrets: TCommitment.SecretsT, index?: bigint) {
      this._key = key;
      this._secrets = {
        amount: secrets.amount ?? 0n,
        blinding: secrets.blinding ?? FnCommitment.BlinderFn(),
      } as TCommitment.SecretsT;

      this.index = index ?? this.index;
    }

    static create(
      key: IPrivacyKey.KeyI,
      secrets: TCommitment.SecretsT,
      index?: bigint,
    ): ICommitment.CommitmentI {
      return new CCommitment.CommitmentC(key, secrets, index);
    }

    get index(): bigint {
      return this._index;
    }

    set index(index: bigint) {
      this._index = index;
    }

    get pubKey(): PubKey {
      return this._key.pubKey;
    }

    get pubKeyHash(): bigint {
      return this._key.pubKeyHash;
    }

    get hash(): bigint {
      return FnCommitment.HashFn(this._secrets, this.pubKey);
    }

    get signature(): Signature {
      return FnCommitment.SignatureFn(this._key.signer, this.hash, this.index);
    }

    get nullifier(): bigint {
      return FnCommitment.NullifierFn(this.signature, this.hash, this.index);
    }

    get nonce(): bigint {
      return this._nonce;
    }

    set nonce(nonce: bigint) {
      this._nonce = nonce;
    }

    get secret_len(): number {
      return CommitmentC.SECRET_LEN;
    }

    get cipherText(): Ciphertext {
      return FnCommitment.EncryptFn(this._key.encryptor, this._secrets, this._nonce);
    }

    get isDummy(): boolean {
      return this._secrets.amount === 0n;
    }
    get isExhausted(): boolean {
      return this._exhausted;
    }

    get raw(): TCommitment.RawT {
      const sig: Signature = this.signature;
      return {
        Pk: this.pubKey.asArray(),
        Units: this._secrets.amount || 0n,
        Index: this.index,
        Hash: this.hash,
        Nullifier: this.nullifier,
        blinding: this._secrets.blinding || 0n,
        SigR8: [BigInt(sig.R8[0]), BigInt(sig.R8[1])],
        SigS: BigInt(sig.S),
      };
    }

    toJSONStr(): string {
      return JSON.stringify({
        pubkey: this.pubKeyHash.toString(16),
        hash: this.hash.toString(16),
        index: this.index.toString(),
        nullifier: this.nullifier.toString(),
        amount: this._secrets.amount === undefined ? '0' : this._secrets.amount.toString(),
        isExhausted: this.isExhausted,
        isDummy: this.isDummy,
      });
    }
  }
}
