import type {
  TPrivacyPool,
  SnarkJSOutputT,
  CircomOutputT,
  CircomArtifactsT,
  StdPackedGroth16ProofT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import type { CircuitSignals } from "snarkjs"

export namespace ICircuit {
  export interface circuitI {
    artifacts: CircomArtifactsT
    _prover?: (
      inputs: CircuitSignals
    ) => Promise<SnarkJSOutputT | CircomOutputT>
    _verifier?: (proof: SnarkJSOutputT | CircomOutputT) => Promise<boolean>

    verify: <
      outputT extends
        | SnarkJSOutputT
        | CircomOutputT
        | StdPackedGroth16ProofT<bigint>,
      resT extends boolean | outputT | { ok: boolean; out: outputT }
    >(
      output: outputT,
      onOk?: (args: { c: circuitI; out: outputT }) => Promise<resT>
    ) => Promise<resT>

    prove: <
      argsT extends TPrivacyPool.GetCircuitInArgsT,
      outputT extends
        | SnarkJSOutputT
        | CircomOutputT
        | StdPackedGroth16ProofT<bigint>,
      resT extends boolean | outputT | { ok: boolean; out: outputT }
    >(
      args: argsT,
      verify?: boolean
    ) => (
      onOk?: (args: { c: circuitI; out: outputT }) => Promise<resT>
    ) => Promise<resT>
  }
}
