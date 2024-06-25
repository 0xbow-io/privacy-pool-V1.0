import type { TGroth16Verifier } from "@privacy-pool-v1/core-ts/pool"
import { Groth16VerifierABI } from "@privacy-pool-v1/global"
import type { Address, PublicClient } from "viem"

export namespace FnGroth16Verifier {
  export const verifyProof_Fn = async (
    publicClient: PublicClient,
    contract: Address,
    args: TGroth16Verifier.verifyProofFn_in_T
  ): Promise<boolean> => {
    const result = await publicClient
      .readContract({
        address: contract,
        abi: Groth16VerifierABI,
        functionName: "verifyProof",
        args,
        account: contract
      })
      .then((result) => {
        return result
      })
      .catch((error) => {
        throw error
      })
    return result
  }
}
