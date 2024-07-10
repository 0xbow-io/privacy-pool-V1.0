import type { InclusionProofT } from "@privacy-pool-v1/zero-knowledge"
import type { LeanIMT } from "@zk-kit/lean-imt"

export namespace IState {
  export interface StateI<
    MerkleT = LeanIMT,
    NullifierT = bigint,
    ProofT = InclusionProofT
  > {
    MAX_MERKLE_DEPTH: bigint | number
    merkleTree: MerkleT
    nullifiers: Set<NullifierT>
    genProofFor: (index: bigint) => ProofT
    insertNullifier: (nullifier: bigint) => boolean
  }
}
