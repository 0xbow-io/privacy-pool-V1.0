import path from 'path';
import { LeanIMT } from '@zk-kit/lean-imt';
import { GetCommitment, GetNullifier, CTX, caclSignalHash } from '@core/account';
import { Hex, hexToBigInt} from 'viem';

import { stringifyBigInts } from 'maci-crypto';

const snarkjs = require('snarkjs') 
import fs from 'fs'


const wc = require('./artifacts/witness_calculator.js')


const maxDepth = 32;


export type ProofInputs = {
  publicVal: bigint;
  signalHash: bigint;
  merkleProofLength: bigint;

  inputNullifier: bigint[];
  inUnits: bigint[];
  inPk: bigint[][];

  inSigR8: bigint[][];
  inSigS: bigint[];

  inBlinding: bigint[];
  inLeafIndices: bigint[];
  merkleProofIndices: bigint[][];
  merkleProofSiblings: bigint[][];

  outCommitment: bigint[];
  outUnits: bigint[];
  outPk: bigint[][];
  outBlinding: bigint[];
};


export async function generateWitness(inputs: ProofInputs, wasmPath: string): Promise<Buffer> {
  try {
    const buffer = fs.readFileSync(wasmPath);
    const witnessCalculator = await wc(buffer)
    const witness_buffer = await witnessCalculator.calculateWTNSBin(inputs, 0);
    return witness_buffer;
  } catch (e) {
    console.error("Error calculating witness: ", e)
    throw e
  }
}



export async function fullProve(inputs: ProofInputs, wasmPath: string, pkeyPath: string): Promise<{ proof: string; publicSignals: bigint[] }> {
  try {
    const buffer = fs.readFileSync(wasmPath);
    const witnessCalculator = await wc(buffer)
    const buff = await witnessCalculator.calculateWTNSBin(inputs, 0);
    const { proof, publicSignals } = await snarkjs.groth16.prove(pkeyPath, buff);
    return {
      proof:
        '0x' +
        hexToBigInt(proof.pi_a[0], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_a[1], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_b[0][1], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_b[0][0], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_b[1][1], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_b[1][0], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_c[0], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_c[1], {size: 32}).toString(16).slice(2),
      publicSignals,
    }
  } catch (e) {
    console.error("Error calculating witness: ", e)
    throw e
  }
}


export async function genProofCallData(inputs: ProofInputs, wasmPath: string, pkeyPath: string): Promise<{ proof: string; publicSignals: bigint[] }> {
  try {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputs,
      wasmPath,
      pkeyPath,
      undefined
    )
    return {
      proof:
        '0x' +
        hexToBigInt(proof.pi_a[0], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_a[1], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_b[0][1], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_b[0][0], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_b[1][1], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_b[1][0], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_c[0], {size: 32}).toString(16).slice(2) +
        hexToBigInt(proof.pi_c[1], {size: 32}).toString(16).slice(2),
      publicSignals,
    }
  } catch (e) {
    console.error("Error generating proof call data: ", e)
    throw e
  }
 
}
