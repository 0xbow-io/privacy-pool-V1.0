import type { TPrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { DummyMerkleProof } from "@privacy-pool-v1/domainobjs"
import type { LeanIMT } from "@zk-kit/lean-imt"

import type { Commitment, InclusionProofT } from "@privacy-pool-v1/domainobjs"

export const MerkleTreeInclusionProof =
  (mt: LeanIMT, maxDepth = 32) =>
  (idx: bigint | number) =>
    FnPrivacyPool.merkleProofFn({ mt, maxDepth })(idx)

export const MerkleTreeInclusionProofs =
  <
    argsT extends Partial<Readonly<TPrivacyPool.GetCircuitInArgsT>>,
    OuT extends Required<InclusionProofT>
  >(
    args: argsT,
    merkleProof: (
      args: argsT
    ) => (idx: bigint | number) => OuT = FnPrivacyPool.merkleProofFn
  ) =>
  (
    voidPredicate: (c: Commitment) => boolean = (c: Commitment) => c.isVoid()
  ): OuT[] =>
    args.existing
      ? args.existing.map((commitment) =>
          voidPredicate(commitment)
            ? (DummyMerkleProof as OuT)
            : (merkleProof(args)(commitment.index) as OuT)
        )
      : []

export namespace FnPrivacyPool {
  /**
   * computes merkle proof for a commitment
   * @param index leaf index of commitment
   * @param mt lean-incremental merkle tree from zk-kit
   * @param maxDepth maximum permitted depht of the merkle tree.
   */
  export const merkleProofFn =
    <
      argsT extends Partial<Readonly<TPrivacyPool.GetCircuitInArgsT>>,
      OuT extends Required<InclusionProofT>
    >(
      args: argsT
    ) =>
    (leafIndex: bigint | number): OuT => {
      if (!args.mt) {
        throw Error("Merkle tree is not defined")
      }
      try {
        const proof = args.mt.generateProof(Number(leafIndex))
        const depth = proof.siblings.length
        for (let i = 0; i < (args.maxDepth ? args.maxDepth : 32); i += 1) {
          if (proof.siblings[i] === undefined) {
            proof.siblings[i] = BigInt(0)
          }
        }
        return {
          root: proof.root,
          index: proof.index,
          actualDepth: BigInt(depth),
          siblings: proof.siblings
        } as OuT
      } catch (e) {
        throw Error(
          `Error generating merkle proof for leaf index ${leafIndex}, error: ${e}`
        )
      }
    }
}
