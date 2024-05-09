
import { numbers} from '@/store/variables'

import {
  packPublicKey,
  unpackPublicKey
} from "@zk-kit/eddsa-poseidon"

import { poseidon3 } from "poseidon-lite/poseidon3"
import { poseidon4 } from "poseidon-lite/poseidon4"


export const BYTES_31 = 31
export const BYTES_62 = 62

export type UTXO = {
  // Values to generate the UTXO commitment & nullifier
  Pk: bigint  // packed public key derived from pk via Baby Jubjub elliptic curve  https://eips.ethereum.org/EIPS/eip-2494
  amount: bigint
  blinding: bigint
  index: bigint
}

export function GetCommitment(utxo: UTXO): bigint {
  // unpack public key
  const Pk = unpackPublicKey(utxo.Pk)

  return poseidon4([utxo.amount, Pk[0], Pk[1], utxo.blinding])
}

export function GetNullifier(utxo: UTXO, sig: bigint): bigint {
  let commitment = GetCommitment(utxo)
  return poseidon3([commitment, utxo.index || numbers.ZERO, sig])
} 