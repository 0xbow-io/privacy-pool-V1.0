import { type TPrivacyPool } from '@privacy-pool-v1/core-ts/zk-circuit/types';

export namespace ICircuit {
  export interface CircuitI<InT = TPrivacyPool.InT, OuT = TPrivacyPool.OutputT> {
    output: OuT | undefined;
    inputs: InT | undefined;
    compute(): Promise<void>;
    verify(output: OuT): Promise<boolean>;
  }
}

export namespace IPrivacyPool {
  export interface InputSignalsI<CommitmentT, MerkleProofT> {
    get: (c: CommitmentT, proof: MerkleProofT) => CommitmentT & MerkleProofT;
  }
}
