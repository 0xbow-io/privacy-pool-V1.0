import { hashLeftRight } from 'maci-crypto';

export function PubKeyHash(pubKey: bigint[]): bigint {
  return hashLeftRight(pubKey[0], pubKey[1]);
}
