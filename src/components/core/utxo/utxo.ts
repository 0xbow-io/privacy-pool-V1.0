
import { numbers} from '@/store/variables'


import { hash3, hash4, Signature} from "maci-crypto"
import {PubKey} from "maci-domainobjs"

export const BYTES_31 = 31
export const BYTES_62 = 62

export type UTXO = {
  // Values to generate the UTXO commitment & nullifier
  Pk: PubKey  
  amount: bigint
  blinding: bigint
  index: bigint
}

export function GetCommitment(utxo: UTXO): bigint {
  return hash4([utxo.amount, utxo.Pk.rawPubKey[0], utxo.Pk.rawPubKey[1], utxo.blinding])
}

export function GetNullifier(utxo: UTXO, sig: Signature): bigint {
  let commitment = GetCommitment(utxo)
  return hash3([commitment, utxo.index || BigInt(0), sig.S as bigint])
} 