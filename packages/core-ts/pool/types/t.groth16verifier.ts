import type { IGroth16Verifier_Contract } from "@privacy-pool-v1/global"
import type { ExtractAbiFunction, AbiParametersToPrimitiveTypes } from "abitype"

// Types binded to Verifier Contract
export namespace TGroth16Verifier {
  export type verifyProofFn_T = ExtractAbiFunction<
    IGroth16Verifier_Contract["abi"],
    "verifyProof"
  >
  export type verifyProofFn_in_T = AbiParametersToPrimitiveTypes<
    verifyProofFn_T["inputs"]
  >
  export type verifyProofFn_out_T = AbiParametersToPrimitiveTypes<
    verifyProofFn_T["outputs"]
  >
}