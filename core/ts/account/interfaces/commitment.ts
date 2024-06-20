import { type Signature, type Ciphertext } from "maci-crypto"
import { PubKey } from "maci-domainobjs"

export namespace ICommitment {
  export interface CommitmentI<
    HashT = bigint,
    PkT = PubKey,
    NullifierT = bigint,
    SigT = Signature,
    CipherT = Ciphertext
  > {
    amount: bigint
    blinding: bigint
    hash: HashT
    pubKey: PkT
    index: bigint
    nonce: bigint
    isDummy: boolean
    isExhausted: boolean
    signature: SigT
    nullifier: NullifierT
    cipherText: CipherT
    secret_len: number
    asStringValues(): any
    asArray(): bigint[]
  }
}
