import type {
  ICircuit,
  TPrivacyPool,
  SnarkJSOutputT,
  CircomOutputT,
  CircomArtifactsT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import type { CircuitSignals } from "snarkjs"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"

/*
export type PrivacyPoolCircuit = ICircuit.CircuitI
export const NewPrivacyPoolCircuit = (
  wasm: string | Uint8Array,
  zkey: string | Uint8Array,
  vKJSON: Groth16_VKeyJSONT
): PrivacyPoolCircuit => new CPrivacyPool.CircuitC(wasm, zkey, vKJSON)
  */
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
      onOk?: (c: ICircuit.circuitI) => Promise<boolean> // callback on when ok = true
    ): Promise<boolean> =>
      this._verifier
        ? await this._verifier(output).then(async (ok: boolean) =>
            ok
              ? onOk
                ? await onOk(this).catch((e) => {
                    throw new Error("callback fn failed", { cause: e })
                  })
                : ok
              : Promise.reject("proof verification failed")
          )
        : Promise.reject("verifier not initialized")

    prove =
      async <argsT extends TPrivacyPool.GetCircuitInArgsT>(
        args: argsT,
        verify = true
      ) =>
      async (
        onOk?: (c: ICircuit.circuitI) => Promise<boolean>
      ): Promise<boolean | SnarkJSOutputT | CircomOutputT> =>
        this._prover
          ? await this._prover(FnPrivacyPool.getInputsFn(args)().inputs)
              .then(async (output) => {
                return verify ? await this.verify(output, onOk) : output
              })
              .catch((e) => {
                throw new Error("unable to compute proof", { cause: e })
              })
          : Promise.reject("prover not initialized")
  }
}
