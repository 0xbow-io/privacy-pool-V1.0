import { getBigInt, toBigInt } from 'ethers'
import { TxRecordEvent } from './types/events'
import { BaseUtxo } from '@core/utxo/types'
import { GeneratePoiStepParams, PoiStepPrivInputs } from '@core/poi/types'
import { poseidonHash, toFixedHex, calculateBitLength, getBitArray } from '@/utils/hash'



class TxRecord {
  public txHash: string | undefined = undefined
  public inputs: BaseUtxo[]
  public outputs: BaseUtxo[]
  public publicAmount: string
  public index: number

  public static fromEvent(event: TxRecordEvent, inputs: BaseUtxo[], outputs: BaseUtxo[]): TxRecord {
    return new TxRecord({
      inputs: inputs,
      outputs: outputs,
      publicAmount: event.publicAmount,
      index: event.index,
      txHash: event.transactionHash,
    })
  }


  public constructor({
    inputs,
    outputs,
    publicAmount = '',
    index = 0,
    txHash = undefined,
  }: {
    inputs: BaseUtxo[]
    outputs: BaseUtxo[] 
    publicAmount?: string
    index?: number
    txHash?: string
  }) {

    this.inputs = inputs
    this.outputs = outputs
    this.publicAmount = publicAmount
    this.index = index
    this.txHash = txHash
  }

  public hash() {
    return poseidonHash([
      poseidonHash([
        this.inputs[0].getNullifier(),
        this.inputs[1].getNullifier(),]),
      poseidonHash([
        this.outputs[0].getCommitment(),
        this.outputs[1].getCommitment(),
      ]),
      getBigInt(this.publicAmount),
      this.index,
    ])
  }

  static hashFromEvent(event: TxRecordEvent) {
    const hx =   poseidonHash([
        getBigInt(event.inputNullifier1),
        getBigInt(event.inputNullifier2),
    ])
    
    const hy = poseidonHash([
        getBigInt(event.outputCommitment1),
        getBigInt(event.outputCommitment2),
    ])

    const hz = poseidonHash([
      hx,
      hy,
      getBigInt(event.publicAmount),
      event.index,
    ])

    //console.log(event)
    //console.log('hx', hx.toHexString())
    //console.log('hy', hy.toHexString())
    //console.log('hz', hz.toHexString())
    return hz
  }

  public toEvent() : TxRecordEvent {
    return {
      inputNullifier1: this.inputs[0].getNullifier().toString(16),
      inputNullifier2: this.inputs[1].getNullifier().toString(16),
      outputCommitment1: this.outputs[0].getCommitment().toString(16),
      outputCommitment2: this.outputs[1].getCommitment().toString(16),
      publicAmount: this.publicAmount,
      index: this.index,
      transactionHash: this.txHash || '',
      blockNumber: 0,
    }
  }

  /*  
    Circom Inputs: 

    // public inputs
    signal input stepIn;                          
    signal input associationMerkleRoot; 
    signal input expectedPathIndices[levels];

    // private inputs
    signal input pubKey; 
    signal input inNullifiers[nIns];
    signal input publicAmount;    
    signal input outAmounts[nOuts];
    signal input outBlindings[nOuts];
    signal input outSignatures[nOuts];
    signal input outIndexes[nOuts];
    signal input accTxRecordsMerkleRoot;
    signal input accTxRecordPathElements[levels];
    signal input associationTreePathElements[levels];
    signal input txRecordAssociationPathIndices[levels];
    signal input isLastStep;

    // public outputs
    signal output stepOut;
    signal output associationMerkleRootOut;
    signal output expectedPathIndicesOut[levels];

  */
 
  public generateInputs({ accTxRecordsMerkleTree, associationMerkleTree, isLastStep}: GeneratePoiStepParams) : PoiStepPrivInputs {

    const txRecord = toFixedHex(this.hash())

    // inclusion proof in accounts Tx Records Merkle Tree
    let txRecordAccPathIndex = 0
    let accTxRecordPathElements = new Array(accTxRecordsMerkleTree.levels).fill(0)

    txRecordAccPathIndex = accTxRecordsMerkleTree.indexOf(txRecord)
    if (txRecordAccPathIndex == -1) {
      throw new Error('txRecord not found in accounts Tx Records')
    }
    accTxRecordPathElements = accTxRecordsMerkleTree.path(txRecordAccPathIndex).pathElements

    // inclusion proof in association Merkle Tree
    // only if txRecord was a a deposit
    let txRecordAssociationPathIndex = 0
    let txRecordAssociationPathIndices = new Array(associationMerkleTree.levels).fill(0)
    let associationTreePathElements = new Array(associationMerkleTree.levels).fill(0)

    if ((getBigInt(this.publicAmount) < (getBigInt(2) ** BigInt(240))) ) {
      txRecordAssociationPathIndex = associationMerkleTree.indexOf(txRecord)
      if (txRecordAssociationPathIndex == -1) {
        throw new Error('txRecord not found in the association set')
      }
      associationTreePathElements = associationMerkleTree.path(txRecordAssociationPathIndex).pathElements
      txRecordAssociationPathIndices = associationMerkleTree.path(txRecordAssociationPathIndex).pathIndices
    }
    
    return {
        pubKey: toBigInt(this.inputs[0].keypair.pubkey),
        inNullifiers: [
            toBigInt(this.inputs[0].getNullifier()), 
            toBigInt(this.inputs[1].getNullifier())
        ],
        publicAmount: getBigInt(this.publicAmount),
        outAmounts: [
            toBigInt(this.outputs[0].amount), 
            toBigInt(this.outputs[1].amount)
        ],
        outBlindings: [
            toBigInt(this.outputs[0].blinding), 
            toBigInt( this.outputs[1].blinding)
        ],
        outSignatures: [
            toBigInt(this.outputs[0].getSignature()), 
            toBigInt(this.outputs[1].getSignature())
        ],
        outIndexes: [this.outputs[0].index, this.outputs[1].index],
        accTxRecordsMerkleRoot: accTxRecordsMerkleTree.root,
        accTxRecordPathElements: accTxRecordPathElements,
        associationTreePathElements: associationTreePathElements,
        txRecordAssociationPathIndices: txRecordAssociationPathIndices,
        isLastStep: isLastStep, 
    }
  }
}

export { TxRecord }
