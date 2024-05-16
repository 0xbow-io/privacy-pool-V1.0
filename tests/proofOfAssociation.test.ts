import {account} from '@core/account'
import {GetCommitment, GetNullifier, CTX, caclSignalHash, TxRecord, txRecord, ProofPrivateInputs} from '@core/account'
import { LeanIMT } from "@zk-kit/imt"
import {ProofInputs, generateProof} from '@core/pool'
import {FIELD_SIZE} from '@/store/variables'

import { hashLeftRight, hash2, stringifyBigInts} from "maci-crypto"
import { WitnessTester, CircuitSignals, Circomkit, CircomkitConfig, CircuitConfig} from 'circomkit';

const fs = require("fs");

import {Hex} from 'viem'

const maxDepth = 32

const circomkitConf =  {
    protocol: "groth16",
    prime: "bn128",
    version: "2.1.9",
    verbose: true,
  }

const proofOfAssociation : CircuitConfig = {
    file : "associationStep",
    template: "AssociationProof",
    dir: "main",
    pubs: [
        "stepIn",
      ],
    "params": [
        32,
        2,
        2
    ]
}


const acc = new account();
const keypair = acc.genKeyPair();
const privKey = keypair.privKey.rawPrivKey
const pubKey = keypair.pubKey.rawPubKey
const circomkit = new Circomkit(circomkitConf as CircomkitConfig);


const associationTree = new LeanIMT(hashLeftRight)
const commitmentTree = new LeanIMT(hashLeftRight)


function randomBlinder() {
    return BigInt(Math.floor(Math.random() * (Number(FIELD_SIZE) -  1)));
}


const txRecords: txRecord[] = []

function getInputs(stepIn: bigint[]): {priv: ProofPrivateInputs, stepOut: bigint[]} {
    // iterate through txRecords  backwards
    // find a Tx record where the nullifier of the ouptut commitment matches one of the challenge nulliifers in stepIn
    let targetTxRecordIndex = -1;
    for (let i = txRecords.length - 1; i >= 0; i--) {
        let outNullifiers = [
            GetNullifier(txRecords[i].outputCTXs[0], acc.signCTX(txRecords[i].outputCTXs[0])),
            GetNullifier(txRecords[i].outputCTXs[1], acc.signCTX(txRecords[i].outputCTXs[1]))
        ]
        // check if any of the outNullifiers match the first non-zero challenge nullifier in stepIn
        let foundMatch = false
        for (let j = 0; j < outNullifiers.length; j++) {
            if (outNullifiers[j] === stepIn[2] || outNullifiers[j] === stepIn[3]) {
                foundMatch = true
            }
        }

        if (foundMatch) {
            targetTxRecordIndex = i
            break
        }
    }

   
    if (targetTxRecordIndex === -1) {
        throw new Error('No matching txRecord found !')
    }

    let r = txRecords[targetTxRecordIndex]

    // compose private inputs
    let privIn : ProofPrivateInputs = {
        publicVal: r.publicVal,

        inUnits: [],
        inPk: [],
        inBlinding: [],
        inLeafIndices: [],
        inSigS: [],

        outUnits: [],
        outPk: [],
        outBlinding: [],
        outSigR8: [],
        outSigS: [],
        outLeafIndices: [],

        commitmentProofLength: 0n,
        commitmentProofIndices: [], 
        commitmentProofSiblings: [],
        
        associationProofLength: 0n,
        associationProofIndices: new Array(maxDepth).fill(0n),
        associationProofSiblings: new Array(maxDepth).fill(0n)
    }

    // for input commitments
    let nextNullifers: bigint[] =  [0,0]
    r.inputCTXs.forEach((utxo, i) => {
        privIn.inUnits.push(utxo.amount)
        privIn.inPk.push(utxo.Pk.rawPubKey)
        privIn.inBlinding.push(utxo.blinding)
        privIn.inLeafIndices.push(utxo.index)


        const sig = acc.signCTX(utxo)
        privIn.inSigS.push(sig.S as bigint)

        if (utxo.amount > 0) {
            let nullifer = GetNullifier(utxo, acc.signCTX(utxo))
            nextNullifers[i] = nullifer
        }

        
    })

    let associationMerkleRoot = 0n
    if (privIn.publicVal > 0) {
        let rIndex = associationTree.indexOf(r.hash())
        let rProof = associationTree.generateProof(rIndex)    

        associationMerkleRoot = rProof.root

        const merkleProofLength = rProof.siblings.length
        privIn.associationProofLength = BigInt(merkleProofLength)

        const merkleProofIndices: bigint[] = []
        const merkleProofSiblings = rProof.siblings

        for (let i = 0; i < maxDepth; i += 1) {
            merkleProofIndices.push((BigInt((rProof.index >> i) & 1)))

            if (merkleProofSiblings[i] === undefined) {
                merkleProofSiblings[i] = BigInt(0)
            }
        }
        privIn.associationProofIndices = merkleProofIndices
        privIn.associationProofSiblings = merkleProofSiblings
    }

     // for output commitments
     let commitmentMerkleRoot = 0n
     r.outputCTXs.forEach((utxo, i) => {
        privIn.outUnits.push(utxo.amount)
        privIn.outPk.push(utxo.Pk.rawPubKey)
        privIn.outBlinding.push(utxo.blinding)

        // get account to sign CTX
        const sig = acc.signCTX(utxo)

        // attach sig components to proof inputs
        privIn.outSigR8.push([sig.R8[0] as bigint, sig.R8[1]  as bigint])
        privIn.outSigS.push(sig.S  as bigint)
        privIn.outLeafIndices.push(utxo.index)

        // get commitment
        const commitment = GetCommitment(utxo)

        const proof = commitmentTree.generateProof(Number(utxo.index))
        commitmentMerkleRoot = proof.root

        const merkleProofLength = proof.siblings.length
        privIn.commitmentProofLength = BigInt(merkleProofLength)

        const merkleProofIndices: bigint[] = []
        const merkleProofSiblings = proof.siblings

        for (let i = 0; i < maxDepth; i += 1) {
            merkleProofIndices.push((BigInt((proof.index >> i) & 1)))

            if (merkleProofSiblings[i] === undefined) {
                merkleProofSiblings[i] = BigInt(0)
            }           
        }
        privIn.commitmentProofIndices.push(merkleProofIndices)
        privIn.commitmentProofSiblings.push(merkleProofSiblings)
    });
  

    return {
        priv: privIn, 
        stepOut: [
            commitmentMerkleRoot,
            associationMerkleRoot,
            nextNullifers[0],
            nextNullifers[1],
            nextNullifers[0],
            nextNullifers[1]
        ]
    }
}



describe("proofOfAssociation", ()  => {

    test("testing step circuit", async () => {
        let circuit = await circomkit.WitnessTester("proofOfAssociation", proofOfAssociation)


        // Generate test txRecords 
        // Create test Association Tree
        // Create pool commitment tree 
        // generate step inputs

        // test amounts of output CTX
        // decrease in amount are releases
        // increase are commitments
        let testAmnts = [100n, 200n, 50n, 100n, 400n, 200n]
        let feeVals = [0n, 0n, 50n, 0n, 0n, 100n]

  
        // initial CTX
        let ctx: CTX = {
            Pk: keypair.pubKey,
            amount: 0n,
            blinding: randomBlinder(),
            index: 0n,
        }

        let dummyCtx =  {
            Pk: keypair.pubKey,
            amount: 0n,
            blinding: randomBlinder(),
            index: BigInt(commitmentTree.size),
        }

        // Generate txRecords for account
        // for simplicity, only 1 input is non-zero and 1 output is non-zero
        // Output Ctx will become the following input CTX
        testAmnts.forEach((amnt, i) => {
            let r = new txRecord(
                    [
                        ctx,
                        dummyCtx
                    ], 
                    [
                        // non-zero output
                        {
                            Pk: keypair.pubKey,
                            amount: amnt,
                            blinding: randomBlinder(),
                            index: BigInt(commitmentTree.size),
                        },
                        // zero output
                        {
                            Pk: keypair.pubKey,
                            amount: 0n,
                            blinding: randomBlinder(),
                            index: BigInt(commitmentTree.size),
                        }
                    ], 
                    [
                        acc.signCTX(ctx),
                        acc.signCTX(dummyCtx)                        
                    ], 
                    feeVals[i]
                )

            // All output commitments are inserted into the commitment tree
            commitmentTree.insert(GetCommitment(r.outputCTXs[0]))
            r.outputCTXs[0].index = BigInt(commitmentTree.size-1)

            commitmentTree.insert(GetCommitment(r.outputCTXs[1]))
            r.outputCTXs[1].index = BigInt(commitmentTree.size-1)

            if (r.publicVal > 0n) {
                associationTree.insert(r.hash())
            }

            txRecords.push(r)

            // non-zero output becomes next non-zero input
            ctx = r.outputCTXs[0]
            dummyCtx = r.outputCTXs[1]
        });

        // all txRecords are generated
        // start generating private inputs per step
        let outputSigs = [
                acc.signCTX(txRecords[txRecords.length -1].outputCTXs[0]), 
                acc.signCTX(txRecords[txRecords.length -1].outputCTXs[1])
        ]

        // initial step In 
        let challengeNullifiers = [
            GetNullifier(txRecords[txRecords.length -1].outputCTXs[0], outputSigs[0]),
            GetNullifier(txRecords[txRecords.length -1].outputCTXs[1], outputSigs[1])
        ]
        
        let stepIn = [
            // commitment merkle root
            0n, 
            // asocciation merkle root
            0n, 
            // challenge nullifiers
            challengeNullifiers[0], 
            challengeNullifiers[1], 
            // queue nullifiers
            0n, 
            0n
        ]

        let isDone = false
        let stepcounter = 0
        while (!isDone) {
            let {priv: priv, stepOut: stepOut}  = getInputs(stepIn);
        
            console.log("privInputs: ", priv)
            console.log("stepIn: ", stepIn)
            console.log("stepOut: ", stepOut)
            circuit.expectPass(
                    {    
                        stepIn: stepIn,
                        publicVal : priv.publicVal, 
                        inUnits: priv.inUnits,
                        inPk: priv.inPk,
                        inBlinding: priv.inBlinding,
                        inLeafIndices: priv.inLeafIndices,
                        inSigS: priv.inSigS,
                        outUnits: priv.outUnits,
                        outPk: priv.outPk,
                        outBlinding: priv.outBlinding,
                        commitmentProofLength: priv.commitmentProofLength,
                        commitmentProofIndices: priv.commitmentProofIndices,
                        commitmentProofSiblings: priv.commitmentProofSiblings,
                        outSigR8: priv.outSigR8,
                        outSigS: priv.outSigS,
                        outLeafIndices: priv.outLeafIndices,
                        associationProofLength: priv.associationProofLength,
                        associationProofIndices: priv.associationProofIndices,
                        associationProofSiblings: priv.associationProofSiblings
                    },{
                        stepOut: stepOut
                    }
                );
            stepIn = stepOut

            if (stepOut[2] == 0n && stepOut[3] == 0n && stepOut[4] == 0n && stepOut[5] == 0n) {
                isDone = true
            }

            let fileName = `inputs/associationProof/step_${stepcounter}.json`
            console.log("writing to file: ", fileName);
            fs.writeFileSync(fileName, JSON.stringify(stringifyBigInts({
                stepIn: stepIn,
                privateInputs: priv,
                expectedStepOut: stepOut
            })));
            stepcounter++
        }
    });
});