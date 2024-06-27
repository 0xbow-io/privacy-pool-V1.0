import type {
  ICircuit,
  TPrivacyPool,
  SnarkJSOutputT,
  CircomOutputT,
  CircomArtifactsT
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
    _verifier?: (proof: SnarkJSOutputT | CircomOutputT) => Promise<boolean>

    constructor(public artifacts: CircomArtifactsT) {
      this._prover = FnPrivacyPool.ProveFn(artifacts.wasm, artifacts.zKey)
      this._verifier = FnPrivacyPool.VerifyFn(artifacts.vKey)
    }

    verify = async <outputT extends SnarkJSOutputT | CircomOutputT>(
      output: outputT,
      onOk?: (args: { c: ICircuit.circuitI; out: outputT }) => Promise<boolean> // callback on when ok = true
    ): Promise<boolean> =>
      this._verifier
        ? await this._verifier(output).then(async (ok: boolean) =>
            ok
              ? onOk
                ? await onOk({ c: this, out: output }).catch(
                    (e: Error): never => {
                      throw new Error("callback fn failed", { cause: e })
                    }
                  )
                : ok
              : Promise.reject("proof verification failed")
          )
        : Promise.reject("verifier not initialized")

    prove =
      <
        argsT extends TPrivacyPool.GetCircuitInArgsT,
        outputT extends SnarkJSOutputT | CircomOutputT
      >(
        args: argsT,
        verify = true
      ) =>
      async (
        onOk?: (args: {
          c: ICircuit.circuitI
          out: outputT
        }) => Promise<boolean>
      ): Promise<boolean | outputT> =>
        this._prover
          ? await this._prover(FnPrivacyPool.getInputsFn(args)().inputs)
              .then(async (output) => {
                return verify
                  ? await this.verify(output as outputT, onOk)
                  : (output as outputT)
              })
              .catch((e) => {
                throw new Error("unable to compute proof", { cause: e })
              })
          : Promise.reject("prover not initialized")
  }
}
