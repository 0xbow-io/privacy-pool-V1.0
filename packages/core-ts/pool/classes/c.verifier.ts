import type { IVerifier, TGroth16Verifier } from "@privacy-pool-v1/core-ts/pool"
import { FnGroth16Verifier } from "@privacy-pool-v1/core-ts/pool"
import type { Address, PublicClient } from "viem"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"

import type {
  TPrivacyPool,
  PrivacyPoolCircuit,
  Groth16_VKeyJSONT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import {
  NewPrivacyPoolCircuit,
  FnPrivacyPool
} from "@privacy-pool-v1/core-ts/zk-circuit"

type proofArgs = TGroth16Verifier.verifyProofFn_in_T

export const GetVerifier = async (
  publicClient: PublicClient,
  verifierAddress: Address,
  artifacts: circomArtifactPaths
): Promise<IVerifier.VerifierI> => {
  return await Promise.resolve(
    CVerifier.verifierC.getVerifier(publicClient, verifierAddress, artifacts)
  )
}

export namespace CVerifier {
  export class verifierC implements IVerifier.VerifierI {
    zkCircuit: PrivacyPoolCircuit
    constructor(
      public publicClient: PublicClient,
      public verifierAddress: Address,
      public wasm: string | Uint8Array,
      public zkey: string | Uint8Array,
      public vKJSON: Groth16_VKeyJSONT
    ) {
      this.zkCircuit = NewPrivacyPoolCircuit(wasm, zkey, vKJSON)
    }

    static getVerifier = async (
      publicClient: PublicClient,
      verifierAddress: Address,
      artifacts: circomArtifactPaths
    ): Promise<IVerifier.VerifierI> => {
      const verifierKey = await FnPrivacyPool.LoadVkeyFn(artifacts.VKEY_PATH)
      const wasm = await FnPrivacyPool.loadBytesFn(artifacts.WASM_PATH)
      const zkey = await FnPrivacyPool.loadBytesFn(artifacts.ZKEY_PATH)
      return new verifierC(
        publicClient,
        verifierAddress,
        wasm,
        zkey,
        verifierKey
      )
    }

    generateProofArgs = async (args: {
      inputs: TPrivacyPool.InT
      ouptuts: bigint[]
    }): Promise<proofArgs> => {
      // generate groth16 proof
      const output = await this.zkCircuit
        .prove(args.inputs)
        .then((out) => {
          return out as TPrivacyPool.OutputT
        })
        .catch((e) => {
          throw new Error("unable to compute proof", { cause: e })
        })
      // verify proof
      await this.zkCircuit
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
