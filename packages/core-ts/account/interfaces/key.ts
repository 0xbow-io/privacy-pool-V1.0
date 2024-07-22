import type { PubKey } from "maci-domainobjs"
import type { Ciphertext, Signature, Plaintext } from "maci-crypto"
import type { Address } from "viem"

export namespace IPrivacyKey {
  export interface KeyI<
    PkT = PubKey,
    SigT = Signature,
    MsgT = bigint,
    CipherT = Ciphertext,
    SecretT = Plaintext
  > {
    pubKey: PkT
    publicAddress: Address
    pubKeyHash: bigint
    asJSON: () => object
    sign(msg: MsgT): SigT
    encrypt(secret: SecretT, nonce: bigint): CipherT
    decrypt(cipher: CipherT, nonce: bigint, secretLen: number): Plaintext
  }
}
