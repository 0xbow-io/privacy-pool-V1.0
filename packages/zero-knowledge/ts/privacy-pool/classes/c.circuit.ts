import type {
  ICircuit,
  TPrivacyPool,
  SnarkJSOutputT,
  CircomOutputT,
  CircomArtifactsT,
  StdPackedGroth16ProofT
} from "@privacy-pool-v1/zero-knowledge"
import type { CircuitSignals } from "snarkjs"
import { FnPrivacyPool } from "@privacy-pool-v1/zero-knowledge"

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
      proof: SnarkJSOutputT | CircomOutputT | StdPackedGroth16ProofT
    ) => Promise<boolean>

    constructor(public artifacts: CircomArtifactsT) {
      this._prover = FnPrivacyPool.proveFn(artifacts.wasm, artifacts.zKey)
      this._verifier = FnPrivacyPool.verifyFn(artifacts.vKey)
    }

    verify = async <
      outputT extends SnarkJSOutputT | CircomOutputT | StdPackedGroth16ProofT,
      resT extends
        | boolean
        | outputT
        | { verified: boolean; packedProof: outputT }
    >(
      output: outputT,
      // callback on when ok = true
      onOk?: (args: { c: ICircuit.circuitI; out: outputT }) => Promise<resT>
    ): Promise<resT> =>
      this._verifier
        ? await this._verifier(output).then(async (verified: boolean) =>
            verified
              ? onOk
                ? await onOk({ c: this, out: output }).catch(
                    (e: Error): never => {
                      throw new Error("callback fn failed", { cause: e })
                    }
                  )
                : (verified as resT)
              : Promise.reject("proof verification faileda")
          )
        : Promise.reject("verifier not initialized")

    prove =
      <
        argsT extends TPrivacyPool.GetCircuitInArgsT,
        outputT extends SnarkJSOutputT | CircomOutputT | StdPackedGroth16ProofT,
        resT extends
          | boolean
          | outputT
          | { verified: boolean; packedProof: outputT }
      >(
        args: argsT,
        verify = true
      ) =>
      async (
        onOk?: (args: { c: ICircuit.circuitI; out: outputT }) => Promise<resT>
      ): Promise<resT> =>
        this._prover
          ? await this._prover(FnPrivacyPool.getCircuitInFn(args)().inputs)
              .then(async (output) => {
                return verify
                  ? await this.verify(output as outputT, onOk)
                  : (output as resT)
              })
              .catch((e) => {
                throw new Error(`proof generation failed, cause: ${e}`)
              })
          : Promise.reject("prover not initialized")
  }
}
