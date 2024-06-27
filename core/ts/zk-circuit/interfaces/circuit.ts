import type {
  TPrivacyPool,
  SnarkJSOutputT,
  CircomOutputT,
  CircomArtifactsT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import type { CircuitSignals } from "snarkjs"

export namespace ICircuit {
  export interface circuitI {
    artifacts: CircomArtifactsT
    _prover?: (
      inputs: CircuitSignals
    ) => Promise<SnarkJSOutputT | CircomOutputT>
    _verifier?: (proof: SnarkJSOutputT | CircomOutputT) => Promise<boolean>

    verify: <outputT extends SnarkJSOutputT | CircomOutputT>(
      output: outputT,
      onOk?: (args: { c: circuitI; out: outputT }) => Promise<boolean>
    ) => Promise<boolean>

    prove: <
      argsT extends TPrivacyPool.GetCircuitInArgsT,
      outputT extends SnarkJSOutputT | CircomOutputT
    >(
      args: argsT,
      verify?: boolean
    ) => (
      onOk?: (args: { c: circuitI; out: outputT }) => Promise<boolean>
    ) => Promise<boolean | outputT>
  }
}
