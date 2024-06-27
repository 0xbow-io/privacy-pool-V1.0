import type {
  ICircuit,
  TPrivacyPool,
  SnarkJSOutputT,
  CircomOutputT,
  CircomArtifactsT,
  PackedGroth16ProofT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import type { CircuitSignals } from "snarkjs"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"

export type PrivacyPoolCircuit = ICircuit.circuitI
export const NewPrivacyPoolCircuit = (
  artifacts: CircomArtifactsT
): PrivacyPoolCircuit => {
  return new CCircuit.circuitC(artifacts)
}

export namespace CCircuit {
  export class circuitC implements ICircuit.circuitI {
    _prover?: (
      inputs: CircuitSignals
    ) => Promise<SnarkJSOutputT | CircomOutputT>
    _verifier?: (
      proof: SnarkJSOutputT | CircomOutputT | PackedGroth16ProofT
    ) => Promise<boolean>

    constructor(public artifacts: CircomArtifactsT) {
      this._prover = FnPrivacyPool.ProveFn(artifacts.wasm, artifacts.zKey)
      this._verifier = FnPrivacyPool.VerifyFn(artifacts.vKey)
    }

    verify = async <
      outputT extends SnarkJSOutputT | CircomOutputT | PackedGroth16ProofT,
      resT extends boolean | outputT | { ok: boolean; out: outputT }
    >(
      output: outputT,
      // callback on when ok = true
      onOk?: (args: { c: ICircuit.circuitI; out: outputT }) => Promise<resT>
    ): Promise<resT> =>
      this._verifier
        ? await this._verifier(output).then(async (ok: boolean) =>
            ok
              ? onOk
                ? await onOk({ c: this, out: output }).catch(
                    (e: Error): never => {
                      throw new Error("callback fn failed", { cause: e })
                    }
                  )
                : (ok as resT)
              : Promise.reject("proof verification failed")
          )
        : Promise.reject("verifier not initialized")

    prove =
      <
        argsT extends TPrivacyPool.GetCircuitInArgsT,
        outputT extends SnarkJSOutputT | CircomOutputT | PackedGroth16ProofT,
        resT extends boolean | outputT | { ok: boolean; out: outputT }
      >(
        args: argsT,
        verify = true
      ) =>
      async (
        onOk?: (args: { c: ICircuit.circuitI; out: outputT }) => Promise<resT>
      ): Promise<resT> =>
        this._prover
          ? await this._prover(FnPrivacyPool.getInputsFn(args)().inputs)
              .then(async (output) => {
                return verify
                  ? await this.verify(output as outputT, onOk)
                  : (output as resT)
              })
              .catch((e) => {
                throw new Error("unable to compute proof", { cause: e })
              })
          : Promise.reject("prover not initialized")
  }
}
