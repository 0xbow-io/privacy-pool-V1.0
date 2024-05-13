
import { BG_ZERO, ZERO_LEAF,  numbers } from '@/store/variables'
import {Keypair} from '@core/account'
import {poseidonHash, poseidonHash2, getBitArray, toFixedHex} from '@/utils/hash'
import {PoiSteps, PoiParams, PoiPubInputs}  from './types'
import {TxRecord} from '@core/txRecord'
import {Element, MerkleTree} from 'fixed-merkle-tree'
import {TxRecordEvents} from '@/components/core/txRecord/types/events'

const poseidonHash2Wrapper = (left: Element, right: Element) => toFixedHex(poseidonHash2(left.toString(), right.toString()))

function buildMerkleTree({ events, height, zeroElement }: { events: TxRecordEvents, height: number, zeroElement: string }) {
    if (zeroElement == undefined) {
      zeroElement = ZERO_LEAF.toString()
    }
    if (height == undefined) {
      height = numbers.TX_RECORDS_MERKLE_TREE_HEIGHT
    }
  
    const leaves = events.sort((a, b) => a.index - b.index).map((e) => toFixedHex(TxRecord.hashFromEvent(e)))
    return new MerkleTree(height, leaves, { hashFunction: poseidonHash2Wrapper, zeroElement: zeroElement})
  }

async function preparePOIInputs(
    keypair: Keypair,
    {
        associationSet, 
        accTxRecords,
        unspentNullifiers,
    } : PoiParams
  ) {
  
    const accTxRecordsMerkleTree = buildMerkleTree({ events: accTxRecords.map((txRecord) => txRecord.toEvent()), height: numbers.TX_RECORDS_MERKLE_TREE_HEIGHT,  zeroElement: ZERO_LEAF.toString()}) // TODO: Change this to use deposits only.
    let associationMerkleTree = buildMerkleTree({ events: associationSet.txRecordEvents, height: numbers.TX_RECORDS_MERKLE_TREE_HEIGHT, zeroElement: ZERO_LEAF.toString()})
      // check if the root is the same
      if (associationMerkleTree.root != associationSet.merkleRoot) {
        console.log('Merkle Root mismatch, got: ' + associationMerkleTree.root + ' expected: ' + associationSet.merkleRoot)
        //throw new Error('Merkle Root mismatch, got: ' + allowedaccTxRecordsMerkleTree.root + ' expected: ' + associationSet.merkleRoot)
      }
    
    console.log("accTxRecordsMerkleTree->", accTxRecordsMerkleTree)
    console.log("allowedaccTxRecordsMerkleTree->", associationMerkleTree)
   
    let circuitSteps : PoiSteps = {
      publicInputs: [
        {
          stepIn: poseidonHash(
            [  
              poseidonHash(
                [
                  accTxRecords[0].hash(),
                  accTxRecords[1].hash(),
                ]
              ),
              keypair.pubkey
            ]
          ), 
          associationMerkleRoot: associationMerkleTree.root,
          expectedPathIndices: new Array(accTxRecordsMerkleTree.levels).fill(0)
        }
      ],
      privateInputs: [],
      expectedOutputs: [],
    }
  
    console.log("building inputs for proof-of-innocence")
    for (let i = 0; i < accTxRecords.length; i++) {
  
      const stepPrivInputs = accTxRecords[i].generateInputs({
        accTxRecordsMerkleTree: accTxRecordsMerkleTree,
        associationMerkleTree: associationMerkleTree,
        isLastStep: i == accTxRecords.length - 1,
      })
  
      circuitSteps.privateInputs.push(stepPrivInputs)
      console.log("privateInput for step {} -> {}", i, stepPrivInputs)
  
  
      /*** verify public inputs ***/
      let currentIdx = 0
      for (let l = 0; l < accTxRecordsMerkleTree.levels; l++) {
        currentIdx +=  circuitSteps.publicInputs[i].expectedPathIndices[l] * (2 ** l)
      }
  
      if (currentIdx != i) {
        throw new Error('Invalid leaf index from expectedPathIndices')
      }
  
      let prevIdx = currentIdx == 0 ? 0 : currentIdx - 1
      let prevPathIndices = getBitArray(prevIdx, accTxRecordsMerkleTree.levels).reverse()
  
      console.log("currentIdx->", currentIdx, " prevIdx->", prevIdx)
  
      let expectedStepIn : bigint = BG_ZERO
      let nodeHash= accTxRecords[i].hash()
      for (let l = 0; l <= accTxRecordsMerkleTree.levels; l++) {
        let leftChild = nodeHash
        let rightChild = stepPrivInputs.accTxRecordPathElements[l]
  
        if (circuitSteps.publicInputs[i].expectedPathIndices[l] == 1) {
          leftChild = stepPrivInputs.accTxRecordPathElements[l]
          rightChild = nodeHash
        }
        nodeHash = poseidonHash([leftChild, rightChild])
        if ( 
              (prevPathIndices[l] == 0 && circuitSteps.publicInputs[i].expectedPathIndices[l] == 1) ||
              (l == 0 && prevIdx == 0 && currentIdx == 0)
          ) {      
           break
        }
      }
      expectedStepIn = poseidonHash([nodeHash, keypair.pubkey])
  
      console.log("stepIn : {} | {}", circuitSteps.publicInputs[i].stepIn, expectedStepIn)
      if (expectedStepIn != circuitSteps.publicInputs[i].stepIn) {
        console.log('expectedStepIn ', expectedStepIn, ' stepIn ', circuitSteps.publicInputs[i].stepIn, ' expectedPathIndices ', circuitSteps.publicInputs[i].expectedPathIndices)
        throw new Error('Invalid step in')
      }
  
      /*** drop any spent Nullifiers ***/
      for (let i = 0; i < stepPrivInputs.inNullifiers.length; i++) {
        if (unspentNullifiers.has(toFixedHex(stepPrivInputs.inNullifiers[i]))) {
          unspentNullifiers.delete(toFixedHex(stepPrivInputs.inNullifiers[i]))
        }
      }
  
      /*** calculate new public inputs ***/
  
      let newPubInputs : PoiPubInputs = {
        stepIn: BG_ZERO, 
        expectedPathIndices: getBitArray(currentIdx + 1, accTxRecordsMerkleTree.levels).reverse(),
        associationMerkleRoot: circuitSteps.publicInputs[i].associationMerkleRoot
      }
  
      // calculate the output nullifiers 
      let outputNullifiers = []
      for (let i = 0; i < 2; i++) {
        let commitment = poseidonHash([stepPrivInputs.outAmounts[i], stepPrivInputs.pubKey, stepPrivInputs.outBlindings[i]])
        let nullifer = poseidonHash([commitment, stepPrivInputs.outIndexes[i],stepPrivInputs.outSignatures[i]])
        outputNullifiers.push(nullifer)
        if (stepPrivInputs.outAmounts[i]>0) {
          unspentNullifiers.add(toFixedHex(nullifer))
        }
      }
      
      if (!stepPrivInputs.isLastStep) {
        nodeHash= accTxRecords[i].hash()
        for (let l = 0; l <= accTxRecordsMerkleTree.levels; l++) {
          let leftChild = nodeHash
          let rightChild = stepPrivInputs.accTxRecordPathElements[l]
    
          if (circuitSteps.publicInputs[i].expectedPathIndices[l] == 1) {
            leftChild = stepPrivInputs.accTxRecordPathElements[l]
            rightChild = nodeHash
          }
          nodeHash = poseidonHash([leftChild, rightChild])
          if (circuitSteps.publicInputs[i].expectedPathIndices[l] == 0 && newPubInputs.expectedPathIndices[l] == 1) {
            newPubInputs.stepIn = poseidonHash([nodeHash, keypair.pubkey])
            break
          }
        }
        circuitSteps.publicInputs.push(newPubInputs)
      } else {
        newPubInputs.stepIn = poseidonHash(outputNullifiers)
      }
  
      circuitSteps.expectedOutputs.push({
        stepOut: newPubInputs.stepIn,
        associationMerkleRootOut: newPubInputs.associationMerkleRoot,
        expectedPathIndicesOut: newPubInputs.expectedPathIndices
      })
  
      console.log("newStepIn-> ", newPubInputs.stepIn, " NewPathIndices-> ", newPubInputs.expectedPathIndices)
    }
  
    console.log("unspentNullifiers->", unspentNullifiers)
    return { poiSteps: circuitSteps, associationSetLeaves: associationMerkleTree.elements, associationSetRoot: associationMerkleTree.root}
  }