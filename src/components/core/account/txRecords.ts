import {CTX, GetCommitment, GetNullifier} from './ctx'
import { hash2, hash4, Signature} from "maci-crypto"
import { Hex } from 'viem'

export interface TxRecord {
    hash(): bigint // hash of the txRecord
}

/*
  A TX Record is a mutation record of input CTXs to yield output CTXs. 
  Such record exists on-chain as an event emitted the pool contrac.
  It is used by ASP's (association set providers) to easily link output commitments & input nullifiers. 

  As of now, txRecord consits of 2 input CTXs & 2 output CTXs
*/
export class txRecord implements TxRecord {
  public inputCTXs: CTX[]
  public outputCTXs: CTX[]
  public inputNullifiers: bigint[]
  public publicVal: bigint
  public extVal: bigint

  // given a set of inputs
  // and desired outputs
  // with fees as feeVal
  // calculate the publicVal & extVal (publicVal = extVal - feeVal)
  // where sum of input amounts + publicVal = sum of output amounts.
  public constructor(input: CTX[], output: CTX[], inputSigs: Signature[], feeVal: bigint){

    // ensure correct length of input & output CTXs
    if (input.length != 2 || output.length != 2) {
      throw new Error('Invalid txRecordEvent, incorrect number of CTXs')
    }

    this.inputCTXs = input
    this.outputCTXs = output
    this.inputNullifiers = input.map((utxo, i) => GetNullifier(utxo, inputSigs[i]))

    let outputSum = output.reduce((acc, utxo) => acc + utxo.amount, 0n)
    let inputSum = input.reduce((acc, utxo) => acc + utxo.amount, 0n)
    this.publicVal = outputSum - inputSum
    this.extVal = this.publicVal - feeVal
  }

  public hash(): bigint {
    return hash4([
      hash2(
        [
          this.inputNullifiers[0],
          this.inputNullifiers[1]
        ]
      ),
      hash2(
        [
          GetCommitment(this.outputCTXs[0]),
          GetCommitment(this.outputCTXs[1]),
        ]
      ), 
      this.publicVal,
      this.outputCTXs[0].index
    ])
  }

}

