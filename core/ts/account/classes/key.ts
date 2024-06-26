import type { Hex, Address } from "viem"
import type { Ciphertext, Signature, Plaintext } from "maci-crypto"
import type { PubKey } from "maci-domainobjs"
import type { TPrivacyKey, IPrivacyKey } from "@privacy-pool-v1/core-ts/account"
import { FnPrivacyKey } from "@privacy-pool-v1/core-ts/account/functions"

// Useful aliases
export type PrivacyKey = IPrivacyKey.KeyI
export function CreatePrivacyKey(privateKey?: Hex): IPrivacyKey.KeyI {
  return CPrivacyKey.PrivacyKeyC.create(privateKey)
}

export namespace CPrivacyKey {
  export class PrivacyKeyC implements IPrivacyKey.KeyI {
    private constructor(private _key: TPrivacyKey.KeyT) {}

    static create(privateKey?: Hex): IPrivacyKey.KeyI {
      return new PrivacyKeyC(FnPrivacyKey.GenPrivacyKeyFn(privateKey))
    }

    get pubKey(): PubKey {
      if (this._key === undefined || this._key?.keypair === undefined) {
        throw new Error("No keypair found")
      }
      return this._key.keypair.pubKey
    }

    get pubKeyHash(): bigint {
      if (this._key === undefined || this._key?.keypair === undefined) {
        throw new Error("No keypair found")
      }
      return FnPrivacyKey.HashhPubKeyFn(this._key.keypair.pubKey)
    }

    get publicAddress(): Address {
      if (this._key === undefined) {
        throw new Error("No keypair found")
      }
      return this._key.account.address
    }

    sign(msg: bigint): Signature {
      if (this._key === undefined || this._key?.keypair === undefined) {
        throw new Error("No keypair found")
      }
      return FnPrivacyKey.SignMsgFn(
        msg,
        this._key.keypair.privKey.rawPrivKey.toString()
      )
    }
    encrypt(secret: Plaintext, nonce: bigint): Ciphertext {
      if (this._key === undefined || this._key?.eK === undefined) {
        throw new Error("kehpair or eK not found")
      }
      return FnPrivacyKey.EncryptFn(secret, nonce, this._key.eK)
    }
    decrypt(cipher: Ciphertext, nonce: bigint, secretLen: number): Plaintext {
      if (this._key === undefined || this._key?.eK === undefined) {
        throw new Error("kehpair or eK not found")
      }
      try {
        const plaintext = FnPrivacyKey.DecryptFn(
          cipher,
          nonce,
          secretLen,
          this._key.eK
        )
        return plaintext
      } catch (e) {
        console.log("Error decrypting message", e)
        throw new Error("Error decrypting message")
      }
    }

    get asJSON(): TPrivacyKey.JSONKeyT {
      return {
        privateKey: this._key.privateKey,
        pubAddr: this.publicAddress,
        keypair: this._key.keypair.toJSON(),
        ek_x: `0x_${this._key?.eK === undefined ? "" : this._key.eK[0].toString(16)}`,
        ek_y: `0x_${this._key?.eK === undefined ? "" : this._key.eK[1].toString(16)}`
      }
    }
  }
}
