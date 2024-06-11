import { Address } from 'viem';
import { TCommitment } from '@core/account/types';
import { MerkleProofT, TPrivacyPool } from '@core/pool/types';
// @ts-expect-error
import { LeanIMT } from '@zk-kit/lean-imt';

export namespace IPrivacyPool {
  export interface ViewI<
    CommitmentT = TCommitment.RawT,
    NullifierT = bigint,
    ProofT = MerkleProofT,
  > {
    id: string;
    address: Address;
    valueUnitRepresentative: Promise<Address>;

    merkleProof(index: CommitmentT): ProofT;
    hasNullifier(nullifier: NullifierT): boolean;
  }
  export interface StateI<MerkleTreeT = LeanIMT, NullifierT = bigint> {
    mt: MerkleTreeT;
    nullifiers: Set<NullifierT>;
  }

  export interface ChainI<ProofT = TPrivacyPool.ChainProof> {
    verifyProof(proof: ProofT): Promise<boolean>;
  }
}
