import {CTX, GetCommitment, GetNullifier} from './ctx'
import { hash2, hash4, Signature} from "maci-crypto"
import { Hex } from 'viem'
import {  Ciphertext}  from 'maci-crypto';
import {caclSignalHash} from './ctx'
import { ProofInputs} from '@core/pool';
import { LeanIMT } from '@zk-kit/lean-imt';



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
  public inputSigs: Signature[]
  public outputCTXs: CTX[]
  public inputNullifiers: bigint[]
  public publicVal: bigint
  public cipherTexts: Ciphertext[]

  // given a set of inputs
  // and desired outputs
  // with fees as feeVal
  // calculate the publicVal & extVal (publicVal = extVal - feeVal)
  // where sum of input amounts + publicVal = sum of output amounts.
  public constructor(input: CTX[], output: CTX[], inputSigs: Signature[], cipherTexts:  Ciphertext[]){

    // ensure correct length of input & output CTXs
    if (input.length != 2 || output.length != 2) {
      throw new Error('Invalid txRecordEvent, incorrect number of CTXs')
    }

    this.inputCTXs = input
    this.outputCTXs = output
    this.inputSigs = inputSigs
    this.cipherTexts = cipherTexts
    this.inputNullifiers = input.map((utxo, i) => GetNullifier(utxo, this.inputSigs[i]))

    let outputSum = output.reduce((acc, utxo) => acc + utxo.amount, 0n)
    let inputSum = input.reduce((acc, utxo) => acc + utxo.amount, 0n)
    this.publicVal = outputSum - inputSum
  }

  public SignalHash(poolAddress: Hex, executingAcc: Hex, feeCollector: Hex, extVal: bigint): bigint{
    return caclSignalHash(poolAddress, this.publicVal, extVal, executingAcc, feeCollector)
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

  public GenProofInputs(
    poolAddrs: Hex,
    executingAcc: Hex,
    feeAcc: Hex,
    tree: LeanIMT,
    feeVal: bigint,
    maxDepth: number
  ): { proofInputs: ProofInputs; expectedMerkleRoot: bigint, extVal: bigint} {

      const extVal = this.publicVal  + feeVal

      let expectedMerkleRoot = 0n;
      let proofInputs: ProofInputs = {
        publicVal: this.publicVal,
        signalHash: caclSignalHash(poolAddrs, this.publicVal, feeVal, executingAcc, feeAcc),
        inUnits: [],
        inPk: [],
        inSigR8: [],
        inSigS: [],
        inBlinding: [],
        inLeafIndices: [],
        inputNullifier: [],
        merkleProofLength: BigInt(0),
        merkleProofIndices: [],
        merkleProofSiblings: [],
        outCommitment: [],
        outUnits: [],
        outPk: [],
        outBlinding: [],
      };

      this.inputCTXs.forEach((ctx, i) => {
        proofInputs.inPk.push(ctx.Pk.rawPubKey);
        proofInputs.inBlinding.push(ctx.blinding);
        proofInputs.inUnits.push(ctx.amount);
        proofInputs.inLeafIndices.push(ctx.index);


        // attach sig components to proof inputs
        proofInputs.inSigR8.push([this.inputSigs[i].R8[0] as bigint, this.inputSigs[i].R8[1] as bigint]);
        proofInputs.inSigS.push(this.inputSigs[i].S as bigint);

        // get nullifier for CTX
        proofInputs.inputNullifier.push(this.inputNullifiers[i]);

          // prepare merkle proof for non-empty CTX
          if (ctx.amount === 0n) {
            proofInputs.merkleProofIndices.push(new Array(maxDepth).fill(0n));
            proofInputs.merkleProofSiblings.push(new Array(maxDepth).fill(0n));
          } else {
            const proof = tree.generateProof(Number(ctx.index));
            expectedMerkleRoot = proof.root;
      
            const merkleProofLength = proof.siblings.length;
            proofInputs.merkleProofLength = BigInt(merkleProofLength);
      
            const merkleProofIndices: bigint[] = [];
            const merkleProofSiblings = proof.siblings;
      
            for (let i = 0; i < maxDepth; i += 1) {
              merkleProofIndices.push(BigInt((proof.index >> i) & 1));
      
              if (merkleProofSiblings[i] === undefined) {
                merkleProofSiblings[i] = BigInt(0);
              }
            }
            proofInputs.merkleProofIndices.push(merkleProofIndices);
            proofInputs.merkleProofSiblings.push(merkleProofSiblings);
          }
      })

      let outCommitment1 = GetCommitment(this.outputCTXs[0]);
      proofInputs.outCommitment.push(outCommitment1);
      proofInputs.outBlinding.push(this.outputCTXs[0].blinding);
      proofInputs.outPk.push(this.outputCTXs[0].Pk.rawPubKey);

      let outCommitment2 = GetCommitment(this.outputCTXs[1]);
      proofInputs.outCommitment.push(outCommitment2);
      proofInputs.outBlinding.push(this.outputCTXs[1].blinding);
      proofInputs.outPk.push(this.outputCTXs[1].Pk.rawPubKey);


      proofInputs.outUnits = [this.outputCTXs[0].amount, this.outputCTXs[1].amount];


      return {proofInputs, expectedMerkleRoot, extVal}
  }
}

