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
      onOk?: (c: circuitI) => Promise<boolean>
    ) => Promise<boolean>

    prove: <argsT extends TPrivacyPool.GetCircuitInArgsT>(
      args: argsT,
      verify?: boolean
    ) => Promise<
      (
        onOk?: (c: circuitI) => Promise<boolean>
      ) => Promise<boolean | SnarkJSOutputT | CircomOutputT>
    >
  }
}
