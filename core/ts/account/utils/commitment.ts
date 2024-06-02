import {
  hash4,
  poseidonEncrypt,
  EcdhSharedKey,
  Ciphertext,
  poseidonDecrypt,
  hash3,
  Signature,
} from 'maci-crypto';
import { FIELD_SIZE } from '@core/pool/constants';
import { CommitmentEvent } from '@core/pool/types';

export function HashCommitment(
  secrets: { amount: bigint; blinding: bigint },
  pubKey: bigint[],
): bigint {
  return hash4([secrets.amount, pubKey[0], pubKey[1], secrets.blinding]);
}

export function EncryptSecrets(
  hash: bigint,
  secrets: { amount: bigint; blinding: bigint },
  eK: EcdhSharedKey,
): Ciphertext {
  return poseidonEncrypt([secrets.amount, secrets.blinding], eK, hash);
}

export function DecryptSecrets(
  eK: EcdhSharedKey,
  event: CommitmentEvent,
): { amount: bigint; blinding: bigint } | undefined {
  try {
    const plainText = poseidonDecrypt(event.cipher, eK, event.hash, 2);
    if (plainText) {
      return { amount: plainText[0], blinding: plainText[1] };
    }
  } catch (e) {}
  return undefined;
}

export function ComputeNullifier(sig: Signature, hash: bigint, index: bigint) {
  return hash3([hash, index, sig.S as bigint]);
}

export function randomBlinder(): bigint {
  return BigInt(Math.floor(Math.random() * (Number(FIELD_SIZE) - 1)));
}
