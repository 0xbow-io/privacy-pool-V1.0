import type { Signature } from "maci-crypto"

export namespace TCommitment {
  export type RawT = {
    pk: string[]
    value: string
    hash: string
    index: string
    nullifier: string
    salt: string
    signature: Signature
  }
  export type SecretsT<N = bigint> = { value: N; salt?: N }
}
