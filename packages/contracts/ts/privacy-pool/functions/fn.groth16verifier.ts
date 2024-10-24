import type { TGroth16Verifier } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { Groth16VerifierABI } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import type { Address, PublicClient, Chain } from "viem"
import { createPublicClient, http } from "viem"

export namespace FnGroth16Verifier {
  /**
    This is a function to verify proof with the Verifier contract
    @param chain: Chain
    @param conn: PublicClient
    @param contract: Address
    @param args: TGroth16Verifier.verifyProofFn_in_T
    @param _conn: PublicClient
    @returns Promise<boolean>
  **/
  export const verifyProofFn =
    (chain?: Chain, conn?: PublicClient) =>
    (
      contract: Address,
      args: TGroth16Verifier.verifyProofFn_in_T,
      _conn: PublicClient = conn
        ? conn
        : createPublicClient({
            chain: chain as Chain,
            transport: http()
          })
    ): Promise<boolean> =>
      _conn
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
}
