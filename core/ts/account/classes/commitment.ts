import { type ICommitment } from "@privacy-pool-v1/core-ts/account/interfaces"
import { type TCommitment } from "@privacy-pool-v1/core-ts/account/types"
import { type IPrivacyKey } from "@privacy-pool-v1/core-ts/account/interfaces"
import { type Signature, type Ciphertext } from "maci-crypto"
import { hash4 } from "maci-crypto"
import assert from "assert"

import { FnCommitment } from "@privacy-pool-v1/core-ts/account/functions"
import { PubKey } from "maci-domainobjs"

// Useful aliases
export type Commitment = ICommitment.CommitmentI
export function CreateCommitment(
  key: IPrivacyKey.KeyI,
  secrets: TCommitment.SecretsT,
  index?: bigint
): Commitment {
  return CCommitment.CommitmentC.create(key, secrets, index)
}

export namespace CCommitment {
  export class CommitmentC implements ICommitment.CommitmentI {
    static readonly SECRET_LEN: number = 2
    _exhausted: boolean = false

    private _secrets: TCommitment.SecretsT
    private _key: IPrivacyKey.KeyI

    // this nullifier is only valid
    // when commitment is non-zero (isDummy) &&:
    // - if the index is true leaf index in the commitment tree
    // - && the nullifier is not yet known (_exhausted)
    // Otherwise valid when commitment is zero (!isDummy)
    public _index: bigint = 0n
    public _nonce: bigint = 0n

    constructor(
      key: IPrivacyKey.KeyI,
      secrets: TCommitment.SecretsT,
      index?: bigint
    ) {
      this._key = key
      this._secrets = {
        amount: secrets.amount ?? 0n,
        blinding: secrets.blinding ?? FnCommitment.BlinderFn()
      } as TCommitment.SecretsT

      this.index = index ?? this.index
    }

    static create(
      key: IPrivacyKey.KeyI,
      secrets: TCommitment.SecretsT,
      index?: bigint
    ): ICommitment.CommitmentI {
      return new CCommitment.CommitmentC(key, secrets, index)
    }

    get index(): bigint {
      return this._index
    }

    set index(index: bigint) {
      this._index = index
    }

    get pubKey(): PubKey {
      return this._key.pubKey
    }

    get pubKeyHash(): bigint {
      return this._key.pubKeyHash
    }

    get hash(): bigint {
      return FnCommitment.HashFn(this._secrets, this.pubKey)
    }

    get signature(): Signature {
      return this._key.sign(hash4(this.asArray()))
    }

    get nullifier(): bigint {
      return FnCommitment.NullifierFn(this.signature, this.hash, this.index)
    }

    get nonce(): bigint {
      return this._nonce
    }

    set nonce(nonce: bigint) {
      this._nonce = nonce
    }

    get secret_len(): number {
      return CommitmentC.SECRET_LEN
    }

    get cipherText(): Ciphertext {
      return this._key.encrypt(
        [this._secrets.amount || 0n, this._secrets.blinding || 0n],
        this._nonce
      )
    }

    get isDummy(): boolean {
      return this._secrets.amount === 0n
    }
    get isExhausted(): boolean {
      return this._exhausted
    }

    get amount(): bigint {
      return this._secrets.amount || 0n
    }

    get blinding(): bigint {
      return this._secrets.blinding || 0n
    }

    asArray = (): bigint[] => {
      const commitment = [...this.pubKey.asArray(), this.hash, this.index]
      assert(commitment.length === 4)
      return commitment
    }

    asStringValues() {
      return {
        pubkey: this.pubKey.asCircuitInputs(),
        hash: this.hash.toString(),
        index: this.index.toString(),
        sig_r8: this.signature.R8.map((r) => r.toString()),
        sig_s: this.signature.S.toString(),
        nullifier: this.nullifier.toString(),
        amount: this.amount.toString(),
        blinding: this.blinding.toString(),
        isExhausted: this.isExhausted,
        isDummy: this.isDummy
      }
    }
  }
}
