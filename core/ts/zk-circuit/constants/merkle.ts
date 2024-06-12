import {type MerkleProofT} from '@privacy-pool-v1/core-ts/zk-circuit/types';

export const MERKLE_TREE_MAX_DEPTH = 32;

export const DummyMerkleProof: MerkleProofT = {
    Root: 0n,
    Depth: 0n,
    LeafIndex: 0n,
    Siblings: new Array<bigint>(MERKLE_TREE_MAX_DEPTH).fill(0n),
  };
  