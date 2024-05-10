import path from "path";

import { stringifyBigInts} from "maci-crypto"
import {StringifiedBigInts} from "maci-crypto/build/ts/types"

import { groth16, wtns } from "snarkjs";


import { Groth16Proof, PublicSignals, CircuitSignals } from "@zk-kit/groth16"

export type ProofInputs = {
    publicVal: bigint,
    signalHash: bigint,
    merkleProofLength: bigint,

    inputNullifier: bigint[],
    inUnits: bigint[],
    inPk: string[][],

    inSigR8: string[][],
    inSigS: string[],

    inBlinding: bigint[],
    inLeafIndices: bigint[],
    merkleProofIndices: bigint[][],
    merkleProofSiblings: bigint[][],

    outCommitment: bigint[],
    outUnits    : bigint[],
    outPk       : string[][],
    outBlinding : bigint[],
}


export async function generateProof(inputs: StringifiedBigInts): Promise<{
    proof: Groth16Proof;
    publicSignals: PublicSignals;
}>{

    const witness = {type: "mem"};
    const wasmPath = '../../../../../public/circuits/privacyPool_js/privacyPool.wasm';
    const provingKeyPath = '../../../../../public/circuits/groth16_pkey.zkey';

    await wtns.calculate(inputs, wasmPath, witness);
    return groth16.prove(provingKeyPath, witness);;
}

   

  