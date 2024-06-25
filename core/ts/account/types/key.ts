import type { Hex, PrivateKeyAccount } from "viem"
import type { Keypair } from "maci-domainobjs"
import type {
  Ciphertext,
  Signature,
  Plaintext,
  EcdhSharedKey
} from "maci-crypto"

export namespace TPrivacyKey {
  export type KeyT<
    PkT = Hex,
    AccT = PrivateKeyAccount,
    KPairT = Keypair,
    EkT = EcdhSharedKey
  > = {
    privateKey: PkT
    account: AccT
    keypair: KPairT
    eK?: EkT
  }
  export type SignerT<MsgT = bigint, SigT = Signature> = (msg: MsgT) => SigT
  export type EncryptorT<PlaintextT = Plaintext, CiphertextT = Ciphertext> = (
    secret: PlaintextT,
    nonce: bigint
  ) => CiphertextT
  export type DecryptorT<CiphertextT = Ciphertext, PlaintextT = Plaintext> = (
    cipher: CiphertextT,
    nonce: bigint,
    secretLen: number
  ) => PlaintextT
}
