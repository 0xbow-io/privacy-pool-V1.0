import { createPublicClient, http, PublicClient } from 'viem';
import { Chain } from 'viem/chains';
import { sepolia } from 'viem/chains';

export const RPC_LIST: Map<number, string> = new Map<number, string>([
  [sepolia.id, String(process.env.NEXT_PUBLIC_RPC_HTTPS_NODE || 'http://localhost/rpc/')],
]);

export function getRpcProviderForChain(chain: Chain): PublicClient {
  let rpcUrl = chain.rpcUrls.default.http[0];
  if (RPC_LIST.has(chain.id)) {
    rpcUrl = RPC_LIST.get(chain.id) ?? chain.rpcUrls.default.http[0];
  }
  return createPublicClient({
    chain: chain,
    transport: http(rpcUrl),
  });
}

export const ChainProviders: Map<Chain, PublicClient> = new Map<Chain, PublicClient>([
  [sepolia, getRpcProviderForChain(sepolia)],
]);
