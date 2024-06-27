import type {
  ICircuit,
  TPrivacyPool,
  SnarkJSOutputT,
  CircomOutputT,
  CircomArtifactsT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"

/*
export type PrivacyPoolCircuit = ICircuit.CircuitI
export const NewPrivacyPoolCircuit = (
  wasm: string | Uint8Array,
  zkey: string | Uint8Array,
  vKJSON: Groth16_VKeyJSONT
): PrivacyPoolCircuit => new CPrivacyPool.CircuitC(wasm, zkey, vKJSON)
  */
export namespace CPrivacyPool {
  export class CircuitC {
    _output?: SnarkJSOutputT | CircomOutputT
    constructor(public artifacts: CircomArtifactsT) {}

    get output(): SnarkJSOutputT | CircomOutputT {
      return this.output
    }

    set output(output: SnarkJSOutputT | CircomOutputT) {
      this._output = output
    }

    verify = async (
      onOk?: (c: CircuitC) => Promise<boolean>
    ): Promise<boolean> =>
      await FnPrivacyPool.VerifyFn()(this.artifacts.vKey, this.output).then(
        async (ok: boolean) =>
          ok
            ? onOk
              ? await onOk(this).catch((e) => {
                  throw new Error("callback fn failed", { cause: e })
                })
              : ok
            : Promise.reject("proof verification failed")
      )

    prove =
      async <argsT extends TPrivacyPool.GetCircuitInArgsT>(
        args: argsT,
        verify = true
      ) =>
      async (
        onOk?: (c: CircuitC) => Promise<boolean>
      ): Promise<boolean | CircuitC | SnarkJSOutputT | CircomOutputT> =>
        await FnPrivacyPool.ProveFn(
          this.artifacts.wasm,
          this.artifacts.zKey
        )(FnPrivacyPool.GetInputsFn(args).inputs)
          .then(async (output) => {
            this.output = output
            return verify ? await this.verify(onOk) : output
          })
          .catch((e) => {
            throw new Error("unable to compute proof", { cause: e })
          })
  }
}
