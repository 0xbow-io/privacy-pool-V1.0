import { numbers } from '@/store/variables';

import { FIELD_SIZE } from '@/store/variables';
import { Hex, keccak256, encodeAbiParameters, fromHex } from 'viem';
import { hash3, hash4, Signature } from 'maci-crypto';
import { PubKey } from 'maci-domainobjs';

export const BYTES_31 = 31;
export const BYTES_62 = 62;

export function randomBlinder(): bigint {
  return BigInt(Math.floor(Math.random() * (Number(FIELD_SIZE) - 1)));
}

// CTX is Commitment Transaction
export type CTX = {
  // Values to generate the CTX commitment & nullifier
  Pk: PubKey;
  amount: bigint;
  blinding: bigint;
  index: bigint;
};

export function NewCTX(Pk: PubKey, amount: bigint, index: bigint): CTX {
  const blinder = randomBlinder();
  return { Pk, amount, blinding: blinder, index };
}

export function GetCommitment(utxo: CTX): bigint {
  return hash4([utxo.amount, utxo.Pk.rawPubKey[0], utxo.Pk.rawPubKey[1], utxo.blinding]);
}

export function GetNullifier(utxo: CTX, sig: Signature): bigint {
  let commitment = GetCommitment(utxo);
  return hash3([commitment, utxo.index || BigInt(0), sig.S as bigint]);
}

export function caclSignalHash(
  poolAddr: Hex,
  units: bigint,
  fee: bigint,
  account: Hex,
  feeCollector: Hex,
): bigint {
  const encodedData = encodeAbiParameters(
    [
      { name: 'poolAddr', type: 'address' },
      { name: 'units', type: 'int256' },
      { name: 'fee', type: 'uint256' },
      { name: 'account', type: 'address' },
      { name: 'feeCollector', type: 'address' },
    ],
    [poolAddr, units, fee, account, feeCollector],
  );
  return fromHex(keccak256(encodedData), 'bigint');
}
