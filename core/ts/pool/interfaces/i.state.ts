import type { MerkleProofT } from "@privacy-pool-v1/core-ts/zk-circuit"
import type { LeanIMT } from "@zk-kit/lean-imt"

export namespace IState {
  export interface StateI<
    MerkleT = LeanIMT,
    NullifierT = bigint,
    ProofArgsT = {
      index: bigint
    },
    ProofT = MerkleProofT
  > {
    MAX_MERKLE_DEPTH: bigint | number
    merkleTree: MerkleT
    nullifiers: Set<NullifierT>
    genProof: (args: ProofArgsT) => ProofT
    insertNullifier: (nullifier: bigint) => boolean
  }
}
