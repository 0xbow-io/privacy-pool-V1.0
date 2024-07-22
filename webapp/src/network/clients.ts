import { createPublicClient, http } from "viem"
import { sepolia, gnosis } from "viem/chains"

export const _sepolia_public_client = createPublicClient({
  chain: sepolia,
  transport: http()
})

export const _gnosis_public_client = createPublicClient({
  chain: gnosis,
  transport: http()
})
