import type { IVerifier, TGroth16Verifier } from "@privacy-pool-v1/core-ts/pool"
import { FnGroth16Verifier } from "@privacy-pool-v1/core-ts/pool"
import type { Address, PublicClient } from "viem"
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

export const LoadRemoteArtifacts = async (): Promise<{
  wasm: string | Uint8Array
  zkey: string | Uint8Array
  verifierKey: Groth16_VKeyJSONT
}> => {
  const paths = getCircomArtifactPaths(
    globalConf,
    project_privacy_pool,
    "PrivacyPool_V1",
    true
  )

  const verifierKey = await FnPrivacyPool.LoadVkeyFn(paths.VKEY_PATH)
  const wasm = await FnPrivacyPool.LoadBinFn(paths.WASM_PATH)
  const zkey = await FnPrivacyPool.LoadBinFn(paths.ZKEY_PATH)
  return { wasm, zkey, verifierKey }
}

export const InitVerifiersCircuit = (
  wasm: string | Uint8Array,
  zkey: string | Uint8Array,
  vKJSON: Groth16_VKeyJSONT
) => {
  CVerifier.verifierC.zkCircuit = NewPrivacyPoolCircuit(wasm, zkey, vKJSON)
}

export const GetVerifier = (
  publicClient: PublicClient,
  verifierAddress: Address
): IVerifier.VerifierI => {
  return CVerifier.verifierC.getVerifier(publicClient, verifierAddress)
}

export namespace CVerifier {
  export class verifierC implements IVerifier.VerifierI {
    static zkCircuit: PrivacyPoolCircuit
    constructor(
      public publicClient: PublicClient,
      public verifierAddress: Address
    ) {}

    static getVerifier = (
      publicClient: PublicClient,
      verifierAddress: Address
    ): IVerifier.VerifierI => {
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

    verifyProofARgs = async (proof: proofArgs): Promise<boolean> => {
      const ok = await FnGroth16Verifier.verifyProof_Fn(
        this.publicClient,
        this.verifierAddress,
        proof
      ).catch((e) => {
        throw new Error("unable to verify proof", { cause: e })
      })
      return ok
    }
  }
}
