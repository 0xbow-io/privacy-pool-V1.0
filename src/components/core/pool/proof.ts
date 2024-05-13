import path from "path";

import { stringifyBigInts} from "maci-crypto"
import {StringifiedBigInts} from "maci-crypto/build/ts/types"

import { groth16, wtns } from "snarkjs";
import axios, { AxiosResponse } from 'axios'


import { Groth16Proof, PublicSignals, CircuitSignals } from "@zk-kit/groth16"

export type ProofInputs = {
    publicVal: bigint,
    signalHash: bigint,
    merkleProofLength: bigint,

    inputNullifier: bigint[],
    inUnits: bigint[],
    inPk: bigint[][],

    inSigR8: bigint[][],
    inSigS: bigint[],

    inBlinding: bigint[],
    inLeafIndices: bigint[],
    merkleProofIndices: bigint[][],
    merkleProofSiblings: bigint[][],

    outCommitment: bigint[],
    outUnits    : bigint[],
    outPk       : bigint[][],
    outBlinding : bigint[],
}


export async function generateProof(inputs: StringifiedBigInts): Promise<{
    proof: Groth16Proof;
    publicSignals: PublicSignals;
}>{

    //const witness = {type: "mem"};
    const wasmPath = "https://github.com/0xbow-io/privacy-pools-v1/blob/dev/web/public/circuits/privacyPool_js/privacyPool.wasm" //'../../../../../public/circuits/privacyPool_js/privacyPool.wasm';
    const provingKeyPath = "https://github.com/0xbow-io/privacy-pools-v1/blob/dev/web/public/circuits/groth16_pkey.zkey" // '../../../../../public/circuits/groth16_pkey.zkey';

    //await wtns.calculate(inputs, wasmPath, witness);
    return groth16.fullProve(inputs,wasmPath, provingKeyPath);
}

   
