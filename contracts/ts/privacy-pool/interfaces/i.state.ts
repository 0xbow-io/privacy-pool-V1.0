import type { InclusionProofT } from "@privacy-pool-v1/domainobjs"
import type { LeanIMT } from "@zk-kit/lean-imt"

export namespace IState {
  export interface StateI<
    MerkleT = LeanIMT,
    NullifierT = bigint,
    ProofT = InclusionProofT
  > {
    MAX_MERKLE_DEPTH: bigint | number
    merkleTree: MerkleT
    /**
     * @dev cipherStore: storage of the ciphertext elements of an encrypted commitment tuple
     * combined with with the associated saltPubKey & commitment hash.
     */
    cipherStore: bigint[][]
    /**
     * @dev rootSet is a set of commitment-roots & null-roots derived from ciphers
     * null-roots function as nullifiers to the commitment-roots
     * commitment-roots can be verified / computed without zk
     * null-roots are computed using zk
     * @note: Using the EnumerableSet library for easy iteration over set elements.
     */
    rootSet: Set<bigint>
    genMerkleProofFor: (index: bigint) => ProofT
  }
}
