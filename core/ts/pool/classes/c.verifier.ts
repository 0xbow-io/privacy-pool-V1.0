import type { IVerifier, TGroth16Verifier } from "@privacy-pool-v1/core-ts/pool"
import { FnGroth16Verifier } from "@privacy-pool-v1/core-ts/pool"
import type { Address, PublicClient } from "viem"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import {
  globalConf,
  getCircomArtifactPaths,
  project_privacy_pool
} from "@privacy-pool-v1/global"
import type {
  Groth16_VKeyJSONT,
  TPrivacyPool,
  PrivacyPoolCircuit
} from "@privacy-pool-v1/core-ts/zk-circuit"
import {
  FnPrivacyPool,
  NewPrivacyPoolCircuit
} from "@privacy-pool-v1/core-ts/zk-circuit"

type proofArgs = TGroth16Verifier.verifyProofFn_in_T

export const LoadRemoteArtifacts = async (
  paths: circomArtifactPaths = getCircomArtifactPaths(
    globalConf,
    project_privacy_pool,
    "PrivacyPool_V1",
    true
  )
): Promise<{
  wasm: string | Uint8Array
  zkey: string | Uint8Array
  verifierKey: Groth16_VKeyJSONT
}> =>
  Promise.all([
    FnPrivacyPool.LoadVkeyFn(paths.VKEY_PATH),
    FnPrivacyPool.LoadBinFn(paths.WASM_PATH),
    FnPrivacyPool.LoadBinFn(paths.ZKEY_PATH)
  ]).then(([verifierKey, wasm, zkey]) => {
    return { wasm, zkey, verifierKey }
  })

export const GetVerifier = (
  wasm: string | Uint8Array,
  zkey: string | Uint8Array,
  vKJSON: Groth16_VKeyJSONT
) => {
  CVerifier.verifierC.zkCircuit = NewPrivacyPoolCircuit(wasm, zkey, vKJSON)
}

export namespace CVerifier {
  export class verifierC implements IVerifier.VerifierI {
    _zkCircuit: PrivacyPoolCircuit

    constructor(
      wasm: string | Uint8Array,
      zkey: string | Uint8Array,
      vKJSON: Groth16_VKeyJSONT
    ) {
      this._zkCircuit = NewPrivacyPoolCircuit(wasm, zkey, vKJSON)
    }

    static getVerifier = (): IVerifier.VerifierI => {
      return new verifierC(publicClient, verifierAddress)
    }

    generateProofArgs = async (args: {
      inputs: TPrivacyPool.InT
      ouptuts: bigint[]
    }): Promise<proofArgs> => {
      // generate groth16 proof
      const output = await verifierC.zkCircuit
        .prove(args.inputs)
        .then((out) => {
          return out as TPrivacyPool.OutputT
        })
        .catch((e) => {
          throw new Error("unable to compute proof", { cause: e })
        })
      // verify proof
      await verifierC.zkCircuit
        .verify(output)
        .then((ok) => {
          if (!ok) {
            throw new Error("proof verification failed")
          }
        })
        .catch((e) => {
          throw new Error("unable to verify proof", { cause: e })
        })

      return FnPrivacyPool.packGroth16ProofFn(output)
    }

    verifyProofArgs = async (
      publicClient: PublicClient,
      verifierAddress: Address,
      proofArgs: proofArgs,
      callbackFn?: (proof: proofArgs) => void
    ): Promise<boolean> =>
      await FnGroth16Verifier.verifyProof_Fn(
        publicClient,
        verifierAddress,
        proofArgs
      ).catch((e) => {
        throw new Error("unable to verify proof", { cause: e })
      })
  }
}
