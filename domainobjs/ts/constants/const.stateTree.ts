import type { InclusionProofT } from "@privacy-pool-v1/domainobjs"

export const MERKLE_TREE_MAX_DEPTH = 32

export const DummyMerkleProof: InclusionProofT = {
  index: 0,
  root: 0n,
  actualDepth: 0n,
  siblings: new Array<bigint>(MERKLE_TREE_MAX_DEPTH).fill(0n)
}
