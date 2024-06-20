import type { Signature } from "maci-crypto"

export namespace TCommitment {
  export type RawT = {
    Pk: string[]
    Units: string
    Hash: string
    Index: string
    Nullifier: string
    blinding: string
    Signature: Signature
  }
  export type SecretsT<N = bigint> = { amount?: N; blinding?: N }
}
