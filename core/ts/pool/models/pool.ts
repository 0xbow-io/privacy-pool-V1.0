import { LeanIMT } from '@zk-kit/lean-imt';
import { hashLeftRight } from 'maci-crypto';
import { MAX_DEPTH } from '@core/pool/constants';
import { PoolMetadata } from '@core/pool/types';

interface view {
  MerkleProof(commitment?: bigint): {
    root: bigint;
    depth: bigint;
    siblings: bigint[];
  };
  NullifierIsKnown(nullifier: bigint): boolean;
}

interface state {
  mt: LeanIMT;
  nullifiers: Set<bigint>;
}

export interface chain {
  meta: PoolMetadata;
}

export type Pool = state & view & chain;

export class PrivacyPool implements Pool {
  nullifiers: Set<bigint>;
  mt: LeanIMT;

  constructor(public meta: PoolMetadata) {
    this.mt = new LeanIMT(hashLeftRight);
    this.nullifiers = new Set();
  }

  Insert(record: { inNullifiers: bigint[]; outCommitments: bigint[]; index: bigint }): {
    root: bigint;
    depth: number;
    size: number;
  } {
    record.inNullifiers.forEach((nullifier) => {
      if (this.nullifiers.has(nullifier)) {
        throw new Error('Nullifier already known');
      }
      this.nullifiers.add(nullifier);
    });

    record.outCommitments.forEach((commitment) => {
      this.mt.insert(commitment);
    });
    return {
      root: this.mt.root,
      depth: this.mt.depth,
      size: this.mt.size,
    };
  }

  MerkleProof(index?: bigint): {
    root: bigint;
    depth: bigint;
    siblings: bigint[];
  } {
    if (index === undefined) {
      return {
        root: 0n,
        depth: 0n,
        siblings: new Array<bigint>(MAX_DEPTH).fill(0n),
      };
    }
    const proof = this.mt.generateProof(Number(index));
    const merkleProofSiblings = proof.siblings;
    for (let i = 0; i < MAX_DEPTH; i += 1) {
      if (merkleProofSiblings[i] === undefined) {
        merkleProofSiblings[i] = BigInt(0);
      }
    }

    return {
      root: proof.root,
      depth: BigInt(proof.siblings.length),
      siblings: merkleProofSiblings,
    };
  }

  NullifierIsKnown(nullifier: bigint): boolean {
    return this.nullifiers.has(nullifier);
  }
}
