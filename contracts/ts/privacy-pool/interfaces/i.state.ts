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
     * @dev rootSet is a set of commitment-roots & null-roots derived from ciphers
     * null-roots function as nullifiers to the commitment-roots
     * commitment-roots can be verified / computed without zk
     * null-roots are computed using zk
     * @note: Using the EnumerableSet library for easy iteration over set elements.
     */
    rootSet: Set<bigint>
    UpdateRootSet: (roots: bigint[]) => bigint
  }
}

/*

zkCircuit?: ICircuit.circuitI

zkArtifacts?: CircomArtifactsT
this.zkCircuit = zkArtifacts
  ? NewPrivacyPoolCircuit(zkArtifacts)
  : undefined

  public zkArtifacts?: CircomArtifactsT


  this.zkCircuit
      ? await this.zkCircuit
          .prove({
            scope: await this.scope(), // calculate scope on the fly if value is not cached
            context: await this.context(_r), // query contract to get context value based on _r
            mt: this.merkleTree,
            maxDepth: this.MAX_MERKLE_DEPTH,
            pkScalars: pkScalars,
            nonces: nonces,
            existing: existingCommitment,
            new: newCommitment
          })(
            //callback fn to verify output on-chain
            async ({ out }) => this.verify(out)
          )
          .then(async (out) => {
            // typecast
            const _out = out as {
              verified: boolean
              packedProof: StdPackedGroth16ProofT<bigint>
            }

            if (_out.verified) {
            }
          })
          .catch((e) => {
            throw new Error(`Error in processing request: ${e}`)
          })
      : false
*/
