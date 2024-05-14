import {account} from '@core/account'
import {GetCommitment, GetNullifier, UTXO} from '@core/utxo'
import { LeanIMT } from "@zk-kit/imt"
import {ProofInputs, generateProof} from '@core/pool'

import { hashLeftRight, hash2, stringifyBigInts} from "maci-crypto"

import { WitnessTester, CircuitSignals, Circomkit, CircomkitConfig, CircuitConfig} from 'circomkit';

const fs = require("fs");

import { createTestClient, http, publicActions, walletActions } from 'viem'

const maxDepth = 32


const privacyPoolConfig : CircuitConfig = {
    file : "privacyPool",
    template: "PrivacyPool",
    dir: "main",
    pubs: [
        "publicVal",
        "signalHash",
        "merkleProofLength",
        "inputNullifier",
        "outCommitment"
      ],
    "params": [
        maxDepth,
        2,
        2
    ]
}

const circomkitConf =  {
    protocol: "groth16",
    prime: "bn128",
    version: "2.1.9",
    verbose: true,
  }


describe("PrivacyPool", () => {

    const acc = new account();
    const keypair = acc.genKeyPair();
    const privKey = keypair.privKey.rawPrivKey
    const pubKey = keypair.pubKey.rawPubKey
    const tree = new LeanIMT(hashLeftRight)
    const circomkit = new Circomkit(circomkitConf as CircomkitConfig);

    test("compiling circuit", async () => {
        try {
            console.log("cleaning artifacts...")
            await circomkit.clean("privacyPool")

            console.log("compiling circuit...")
            await circomkit.compile("privacyPool", privacyPoolConfig)
            
            let rc1sInfo = await circomkit.info("privacyPool")
            console.log("circuit rc1sInfo: ", rc1sInfo)

            fs.writeFileSync("circomkit.json", JSON.stringify(circomkitConf));

            fs.writeFileSync("cricuit.json", JSON.stringify({
                "privacyPool": privacyPoolConfig
            }));


        } catch (error) {
            console.log("error: ", error)
        }
    });
  

    test("testing circuit", async () => {
        let circuit = await circomkit.WitnessTester("privacyPool", privacyPoolConfig)
        
        // (1) empty tree, empty state, commit non-empty UTXO of amount 100
        let publicVal = 100n
        let proofInputs: ProofInputs = {
            publicVal: publicVal,
            signalHash: hash2([100n, 200n]),
            inUnits: [],
            inPk: [
                    [pubKey[0], pubKey[1]], 
                    [pubKey[0], pubKey[1]]
                ],
            inSigR8: [],
            inSigS: [],
            inBlinding: [BigInt(Math.floor(Math.random() * 100)), BigInt(Math.floor(Math.random() * 100))],
            inLeafIndices: [],
            inputNullifier: [],
            merkleProofLength: BigInt(0),
            merkleProofIndices: [],
            merkleProofSiblings: [],
            outCommitment: [],
            outUnits: [],
            outPk: [
                [pubKey[0], pubKey[1]], 
                [pubKey[0], pubKey[1]]
            ],
            outBlinding: [],
        }

        // Generate 2 input UTXOs, with one empty and one non-empty
        proofInputs.inUnits = [0n, publicVal]
 


        // (2) non-empty tree, non empty state, add to existing UTXO & commit


        // (3) non-empty tree, non empty state, substract from existing UTXO & release 

        fs.writeFileSync("inputs/privacyPool/default.json", JSON.stringify(stringifyBigInts(proofInputs)));

    });
  });
  