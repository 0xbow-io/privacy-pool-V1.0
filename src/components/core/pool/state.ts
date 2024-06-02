import { Chain } from 'viem/chains';
import { Address, PublicClient, AbiFunction, fromHex, Hex } from 'viem';
import { ChainProviders } from '@utils/provider';
import { Commitment, NewCommitmentEvent, NewNullifierEvent, NewTxRecordEvent } from '@core/pool';
import { LeanIMT } from '@zk-kit/lean-imt';
import { hashLeftRight } from 'maci-crypto';
import { maxDepth } from './proof';

import { Ctx } from '@core/account';

export class poolState {
  mt: LeanIMT;
  nullifiers: Set<bigint>;
  commitments: Map<Hex, Ctx>;
  // tx record events
  constructor() {
    this.mt = new LeanIMT(hashLeftRight);
    this.nullifiers = new Set<bigint>();
    this.commitments = new Map<Hex, Ctx>();
  }

  merkleProof(ctx: Ctx): {
    root: bigint;
    depth: bigint;
    siblings: bigint[][];
    index: bigint;
  } {
    let index = ctx.index < 0 ? this.mt.indexOf(ctx.commitment) : Number(ctx.index);
    if (index < 0) {
      throw new Error('commitment doesn notexist in the tree');
    }
    const proof = this.mt.generateProof(index);
    let siblings: bigint[][] = [];
    const proofSiblings = proof.siblings;
    for (let i = 0; i < maxDepth; i += 1) {
      if (proofSiblings[i] === undefined) {
        proofSiblings[i] = BigInt(0);
      }
    }
    siblings.push(proofSiblings);

    return {
      root: proof.root,
      depth: BigInt(proof.siblings.length),
      siblings: siblings,
      index: BigInt(index),
    };
  }
}
