import type { PubKey, Keypair } from "maci-domainobjs"
import type { Ciphertext, Signature, Plaintext } from "maci-crypto"
import type { Address } from "viem"

export namespace IPrivacyKey {

  type JSONKey = {
    privateKey: string
    pubAddr: Address
    keypair: Keypair
    ek_x: string
    ek_y: string
  }

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
    asJSON: () => JSONKey
    sign(msg: MsgT): SigT
    encrypt(secret: SecretT, nonce: bigint): CipherT
    decrypt(cipher: CipherT, nonce: bigint, secretLen: number): Plaintext
  }
}
