import type { TGroth16Verifier } from "@privacy-pool-v1/core-ts/pool"

import type {
  ICircuit,
  TPrivacyPool
} from "@privacy-pool-v1/core-ts/zk-circuit"

export namespace IVerifier {
  export interface VerifierI<
    ProofArgsT = TGroth16Verifier.verifyProofFn_in_T,
    CircuitT = ICircuit.CircuitI,
    InputArgsT = {
      inputs: TPrivacyPool.InT
      ouptuts: bigint[]
    }
  > {
    zkCircuit: CircuitT
    generateProofArgs: (inputs: InputArgsT) => Promise<ProofArgsT>
    verifyProofARgs: (args: ProofArgsT) => Promise<boolean>
  }
}
