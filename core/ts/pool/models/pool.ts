import { LeanIMT } from '@zk-kit/lean-imt';
import { hashLeftRight } from 'maci-crypto';
import { MAX_DEPTH } from '@core/pool/constants';
import { PoolMetadata } from '@core/pool/types';
import { PublicClient, WalletClient, Address } from 'viem';

interface View {
  id: string;
  address: Address;
  valueUnitRepresentative: Promise<Address>;
  MerkleProof(commitment?: bigint): {
    root: bigint;
    depth: bigint;
    siblings: bigint[];
  };
  NullifierIsKnown(nullifier: bigint): boolean;
  VerifyProofOnChain(proof: {
    pi_a: bigint[];
    pi_b: bigint[][];
    pi_c: bigint[];
    publicSignals: bigint[];
  }): Promise<boolean>;
}

interface State {
  mt: LeanIMT;
  nullifiers: Set<bigint>;
}

export type ChainConf = {
  meta: PoolMetadata;
  pubCL?: PublicClient;
  wallets?: WalletClient[];
  contracts?: {
    pool: any;
    verifier: any;
  };
};

export interface Chain {
  chain: ChainConf;
}

export type Pool = State & View & Chain;

export class PrivacyPool implements Pool {
  public mt: LeanIMT = new LeanIMT(hashLeftRight);
  public nullifiers: Set<bigint> = new Set();
  constructor(public chain: ChainConf) {}

  get id(): string {
    return this.chain.meta.id;
  }

  get address(): Address {
    return this.chain.meta.address;
  }

  get valueUnitRepresentative(): Promise<Address> {
    return (async () => {
      try {
        const val = await this.chain.contracts?.pool.read.valueUnitRepresentative();
        return val as Address;
      } catch (error) {
        console.log('Error reading valueUnitRepresentative');
        return '0x';
      }
    })();
  }

  async VerifyProofOnChain(proof: {
    pi_a: bigint[];
    pi_b: bigint[][];
    pi_c: bigint[];
    publicSignals: bigint[];
  }): Promise<boolean> {
    try {
      var res = await this.chain.contracts?.verifier.read.verifyProof([
        proof.pi_a,
        proof.pi_b,
        proof.pi_c,
        proof.publicSignals,
      ]);
      return res as boolean;
    } catch (error) {
      console.log('unable to verifying proof onchain');
      return false;
    }
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
