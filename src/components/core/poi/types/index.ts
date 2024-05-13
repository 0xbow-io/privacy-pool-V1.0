
import {Element, MerkleTree} from 'fixed-merkle-tree'
import {TxRecord} from '@core/txRecord'
import {AssociationSet} from '@core/asp/types'

export type PoiParams = {
    accTxRecords: TxRecord[]
    unspentNullifiers: Set<string>
    associationSet: AssociationSet
}
  

export type PoiInputs = {
    poiSteps: PoiSteps
    associationSetLeaves:  Element[]
    associationSetRoot: Element
}

export type GeneratePoiStepParams = {
    accTxRecordsMerkleTree: MerkleTree
    associationMerkleTree: MerkleTree
    isLastStep: boolean  
  }
  
  export type PoiPubInputs = {
    stepIn: bigint
    associationMerkleRoot: Element
    expectedPathIndices: number[]
  }
  
  export type PoiStepPrivInputs = {
    pubKey: bigint
    inNullifiers: [bigint, bigint]
    publicAmount: bigint
    outAmounts: [bigint, bigint]
    outBlindings: [bigint, bigint]
    outSignatures: [bigint, bigint]
    outIndexes: [number, number]
    accTxRecordsMerkleRoot: Element
    accTxRecordPathElements: bigint[]
    associationTreePathElements: bigint[]
    txRecordAssociationPathIndices: number[]
    isLastStep: boolean
  }
  
  
  export type PoiStepOutputs = {
    stepOut: bigint
    associationMerkleRootOut: Element
    expectedPathIndicesOut: number[]
  }
  
  export type PoiSteps = {
    publicInputs: PoiPubInputs[]
    privateInputs: PoiStepPrivInputs[]
    expectedOutputs: PoiStepOutputs[] 
  }
  
  export type PublicInputs = {
    step_in: BigInt[]
  }
  export type PrivateInputs = {
    pubKey: BigInt,
    inNullifiers: BigInt[],
    publicAmount: BigInt,
    outAmounts: BigInt[],
    outBlindings: BigInt[],
    outSignatures: BigInt[],
    outIndexes: number[],
    accTxRecordsMerkleRoot: BigInt,
    accTxRecordPathElements: BigInt[],
    associationTreePathElements: BigInt[],
    txRecordAssociationPathIndices: number[],
    isLastStep: number
  }