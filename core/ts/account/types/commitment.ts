import type { Signature } from "maci-crypto"

export namespace TCommitment {
  export type RawT = {
    Pk: string[]
    Value: string
    Hash: string
    Index: string
    Nullifier: string
    salt: string
    Signature: Signature
  }
  export type SecretsT<N = bigint> = { value: N; salt?: N }
}
