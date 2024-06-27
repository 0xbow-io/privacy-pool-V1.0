import type {
  TCommitment,
  ICommitment,
  IPrivacyKey
} from "@privacy-pool-v1/core-ts/account"
import type { Signature, Ciphertext } from "maci-crypto"
import type { PubKey } from "maci-domainobjs"
import { FnCommitment } from "@privacy-pool-v1/core-ts/account/functions"

import { hash4 } from "maci-crypto"

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
    _exhausted?: boolean

    private _secrets: TCommitment.SecretsT
    private _key: IPrivacyKey.KeyI

    // this nullifier is only valid
    // when commitment is non-zero (isDummy) &&:
    // - if the index is true leaf index in the commitment tree
    // - && the nullifier is not yet known (_exhausted)
    // Otherwise valid when commitment is zero (!isDummy)
    public _index?: bigint
    public _nonce?: bigint

    _hasher: (secrets: TCommitment.SecretsT) => bigint

    constructor(
      key: IPrivacyKey.KeyI,
      secrets: TCommitment.SecretsT,
      index?: bigint
    ) {
      this._key = key
      this._secrets = {
        value: secrets.value,
        salt: secrets.salt ?? FnCommitment.SaltFn()
      } as TCommitment.SecretsT
      this._hasher = FnCommitment.hashFn(this._key.pubKey)
      this._index = index ?? 0n
    }

    static create(
      key: IPrivacyKey.KeyI,
      secrets: TCommitment.SecretsT,
      index?: bigint
    ): ICommitment.CommitmentI {
      return new CCommitment.CommitmentC(key, secrets, index)
    }

    hash = (): bigint => this._hasher(this._secrets)

    asArray = (): bigint[] => [
      ...this.pubKey.rawPubKey,
      this.hash(),
      this.index
    ]

    get index(): bigint {
      return this._index ?? 0n
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

    get signature(): Signature {
      return this._key.sign(hash4(this.asArray()))
    }

    get nullifier(): bigint {
      return FnCommitment.NullifierFn(this.signature, this.hash(), this.index)
    }

    get nonce(): bigint {
      return this._nonce ?? 0n
    }

    set nonce(nonce: bigint) {
      this._nonce = nonce
    }

    get secret_len(): number {
      return CommitmentC.SECRET_LEN
    }

    get cipherText(): Ciphertext {
      return this._key.encrypt(
        [this._secrets.value || 0n, this._secrets.salt || 0n],
        this.nonce
      )
    }

    get isDummy(): boolean {
      return this._secrets.value === 0n
    }
    get isExhausted(): boolean {
      return this._exhausted ?? false
    }

    get value(): bigint {
      return this._secrets.value || 0n
    }

    get salt(): bigint {
      return this._secrets.salt || 0n
    }

    asStringValues() {
      return {
        pubkey: this.pubKey.asCircuitInputs(),
        hash: this.hash.toString(),
        index: this.index.toString(),
        sig_r8: this.signature.R8.map((r) => r.toString()),
        sig_s: this.signature.S.toString(),
        nullifier: this.nullifier.toString(),
        value: this.value.toString(),
        salt: this.salt.toString(),
        isExhausted: this.isExhausted,
        isDummy: this.isDummy
      }
    }
  }
}
