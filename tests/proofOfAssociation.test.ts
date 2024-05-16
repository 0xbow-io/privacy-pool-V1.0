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

const txRecords: txRecord[] = []

const associationTree = new LeanIMT(hashLeftRight)
const commitmentTree = new LeanIMT(hashLeftRight)


function randomBlinder() {
    return BigInt(Math.floor(Math.random() * (Number(FIELD_SIZE) -  1)));
}

function getInputs(stepIn: bigint[]): ProofPrivateInputs {

    //let pi : ProofPrivateInputs = {}

    // iterate through txRecords  backwards
    // find a Tx record where the nullifier of the ouptut commitment matches one of the challenge nulliifers in stepIn
    let targetTxRecordIndex = -1;
    for (let i = txRecords.length - 1; i >= 0; i++) {
        let outNullifiers = [
            GetNullifier(txRecords[i].outputCTXs[0], acc.signCTX(txRecords[i].outputCTXs[0])),
            GetNullifier(txRecords[i].outputCTXs[1], acc.signCTX(txRecords[i].outputCTXs[1]))
        ]
        // check if any of the outNullifiers match the first non-zero challenge nullifier in stepIn
        let foundMatch = false
        for (let j = 0; j < outNullifiers.length; j++) {
            if (outNullifiers[j] === stepIn[4] || outNullifiers[j] === stepIn[5]) {
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

    if r.publicVal > 0 {
        let rIndex = associationTree.indexOf(r.hash())
        let rProof = associationTree.generateProof(rIndex)    
    }
  
    let rHash = r.hash()

    // compose private inputs
    let privIn : ProofPrivateInputs = {
        publicVal: r.publicVal,
    }


}



describe("proofOfAssociation", () => {
    test("testing step circuit", async () => {

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
            r.outputCTXs[0].index = BigInt(commitmentTree.size)

            commitmentTree.insert(GetCommitment(r.outputCTXs[1]))
            r.outputCTXs[1].index = BigInt(commitmentTree.size)

            if r.publicVal > 0n {
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
            0n,
            0n,
            0n, 
            0n, 
            challengeNullifiers[0], 
            challengeNullifiers[1], 
            0n, 
            0n
        ]

        let privInputs = getInputs(stepIn);
    });

});