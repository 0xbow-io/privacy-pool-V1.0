import { type IPrivacyPool } from '@privacy-pool-v1/core-ts/pool/interfaces';
import { type TPrivacyPool } from '@privacy-pool-v1/core-ts/pool/types';
import { type TCommitment } from '@privacy-pool-v1/core-ts/account/types';
import { type MerkleProofT } from '@privacy-pool-v1/core-ts/zk-circuit/types';
import { type Address } from 'viem';

import { FnPrivacyPool } from '@privacy-pool-v1/core-ts/zk-circuit/functions';

import { LeanIMT } from '@zk-kit/lean-imt';
import { hashLeftRight } from 'maci-crypto';

// Handy Aliases
export namespace CPrivacyPool {
  export class ChainC implements IPrivacyPool.ChainI {
    constructor(public conf: TPrivacyPool.ChainConfT) {}

    get id(): string {
      return this.conf.meta.id;
    }
    get address(): Address {
      return this.conf.meta.address;
    }

    get valueUnitRepresentative(): Promise<Address> {
      return (async () => {
        try {
          const val = await this.conf.contracts?.pool.read.valueUnitRepresentative();
          return val as Address;
        } catch (error) {
          console.log('Error reading valueUnitRepresentative');
          return '0x';
        }
      })();
    }

    get contracts(): any {
      return this.conf.contracts;
    }

    async verifyProof(proof: TPrivacyPool.ChainProof): Promise<boolean> {
      try {
        var res = await this.contracts.verifier.read.verifyProof(proof);
        return res as boolean;
      } catch (error) {
        console.log('unable to verifying proof onchain');
        return false;
      }
    }
  }

  export class StateC extends ChainC implements IPrivacyPool.StateI {
    static MAX_DEPTH = 32;

    mt: LeanIMT = new LeanIMT(hashLeftRight);
    nullifiers: Set<bigint> = new Set();

    constructor(conf: TPrivacyPool.ChainConfT) {
      super(conf);
    }

    merkleProof(commitment: TCommitment.RawT): MerkleProofT {
      return FnPrivacyPool.MerkleProofFn(commitment, this.mt);
    }

    hasNullifier(nullifier: bigint): boolean {
      return this.nullifiers.has(nullifier);
    }
  }

  export class PoolC
    extends StateC
    implements IPrivacyPool.StateI, IPrivacyPool.ChainI, IPrivacyPool.ViewI
  {
    constructor(conf: TPrivacyPool.ChainConfT) {
      super(conf);
    }
  }
}
