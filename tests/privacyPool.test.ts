import {account} from '@core/account'
import {GetCommitment, GetNullifier, UTXO, caclSignalHash} from '@core/utxo'
import { LeanIMT } from "@zk-kit/imt"
import {ProofInputs, generateProof} from '@core/pool'
import {FIELD_SIZE} from '@/store/variables'

import { hashLeftRight, hash2, stringifyBigInts} from "maci-crypto"

import { WitnessTester, CircuitSignals, Circomkit, CircomkitConfig, CircuitConfig} from 'circomkit';

const fs = require("fs");

import {Hex} from 'viem'

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


const acc = new account();
const keypair = acc.genKeyPair();
const privKey = keypair.privKey.rawPrivKey
const pubKey = keypair.pubKey.rawPubKey
const tree = new LeanIMT(hashLeftRight)
const circomkit = new Circomkit(circomkitConf as CircomkitConfig);
const privacyPoolAddr = "0x6ab4B83244d58f48C576d6Ed7D1b174F6C5b6C13" as Hex // create2 address
const dummyAccount =  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Hex




async function generateProofInputs(publicVal: bigint, inputUTXOs: UTXO[]): Promise<{proofInputs: ProofInputs, outputUtxos: UTXO[], expectedMerkleRoot: bigint}> {
    let proofInputs: ProofInputs = {
        publicVal: publicVal,
        signalHash: caclSignalHash(privacyPoolAddr, publicVal, 0n, dummyAccount, dummyAccount),
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

    let expectedMerkleRoot = 0n;

    // prepare input data
    inputUTXOs.forEach((utxo, i) => {

        proofInputs.inPk.push(utxo.Pk.rawPubKey)

        proofInputs.inBlinding.push(utxo.blinding)
        proofInputs.inUnits.push(utxo.amount)
        proofInputs.inLeafIndices.push(utxo.index)

        // get commitment
        const commitment = GetCommitment(utxo)

        // get account to sign UTXO
        const sig = acc.signUTXO(utxo)
        // attach sig components to proof inputs
        proofInputs.inSigR8.push([sig.R8[0] as bigint, sig.R8[1]  as bigint])
        proofInputs.inSigS.push(sig.S  as bigint)

        // get nullifier for UTXO 
        proofInputs.inputNullifier.push(GetNullifier(utxo, sig))  

        // prepare merkle proof for non-empty UTXO
        if (utxo.amount === 0n) {
            proofInputs.merkleProofIndices.push(new Array(maxDepth).fill(0n))
            proofInputs.merkleProofSiblings.push(new Array(maxDepth).fill(0n))
        } else {
            const proof = tree.generateProof(Number(utxo.index))
            expectedMerkleRoot = proof.root

            const merkleProofLength = proof.siblings.length
            proofInputs.merkleProofLength = BigInt(merkleProofLength)

            const merkleProofIndices: bigint[] = []
            const merkleProofSiblings = proof.siblings

            for (let i = 0; i < maxDepth; i += 1) {
                merkleProofIndices.push((BigInt((proof.index >> i) & 1)))

                if (merkleProofSiblings[i] === undefined) {
                    merkleProofSiblings[i] = BigInt(0)
                }
            }
            proofInputs.merkleProofIndices.push(merkleProofIndices)
            proofInputs.merkleProofSiblings.push(merkleProofSiblings)
        }
    });

    let outputUtxos: UTXO[] = []

    // Generate 1 Output UTXO that has a value of the input UTXOS + publicval 
    outputUtxos[0] = {
        Pk: keypair.pubKey,
        amount: proofInputs.inUnits[0] + proofInputs.inUnits[1] + proofInputs.publicVal,
        blinding: BigInt(Math.floor(Math.random() * 100)),
        index: BigInt(tree.size),
    }
    let outCommitment1 = GetCommitment(outputUtxos[0])
    proofInputs.outCommitment.push(outCommitment1)
    proofInputs.outBlinding.push(outputUtxos[0].blinding) 
    proofInputs.outPk.push(outputUtxos[0].Pk.rawPubKey)

    // Generate 1 Output UTXO that has a value of 0 
    outputUtxos[1] = {
        Pk: keypair.pubKey,
        amount: 0n,
        blinding: BigInt(Math.floor(Math.random() * 100)),
        index: 0n,
    }

    let outCommitment2 = GetCommitment(outputUtxos[1])
    proofInputs.outCommitment.push(outCommitment2)
    proofInputs.outBlinding.push(outputUtxos[1].blinding)
    proofInputs.outPk.push(outputUtxos[1].Pk.rawPubKey)

    proofInputs.outUnits = [proofInputs.inUnits[0] + proofInputs.inUnits[1] + proofInputs.publicVal, 0n]

    // insert output UTXOs into the tree
    tree.insert(outCommitment1) 
    tree.insert(outCommitment2)



    return {proofInputs, outputUtxos, expectedMerkleRoot};
}


function randomBlinder() {
    return BigInt(Math.floor(Math.random() * (Number(FIELD_SIZE) -  1)));
  }
  

describe("PrivacyPool", () => {
    test("testing circuit", async () => {
        let circuit = await circomkit.WitnessTester("privacyPool", privacyPoolConfig)
        
        let extVals = [100n, 200n, -300n]

        let unspentUTXO: UTXO = {
            Pk: keypair.pubKey,
            amount: 0n,
            blinding: randomBlinder(),
            index: 0n,
        }

        extVals.forEach(async (extVal, i) => {
            let publicVal = extVal >= 0 ? extVal : FIELD_SIZE - (extVal + FIELD_SIZE) % FIELD_SIZE
            const {proofInputs: proofInputs, outputUtxos: outputUtxos, expectedMerkleRoot: expectedMerkleRoot} = await generateProofInputs(publicVal, [
                unspentUTXO,
                {
                    Pk: keypair.pubKey,
                    amount: 0n,
                    blinding: randomBlinder(),
                    index: 0n,
                }
            ]);

            unspentUTXO = outputUtxos[0]

            console.log("proofInputs: ", stringifyBigInts(proofInputs))
            console.log("outputUtxos: ", outputUtxos)

            let fileName = `inputs/privacyPool/test_${i}.json`
            console.log("writing to file: ", fileName);
            await fs.writeFileSync(fileName, JSON.stringify(stringifyBigInts(proofInputs)));

            if (expectedMerkleRoot > 0n) {
                console.log("expectedRoot : ", expectedMerkleRoot)
                await circuit.expectPass(
                    {    
                        publicVal: proofInputs.publicVal, 
                        signalHash : proofInputs.signalHash, 
                        merkleProofLength: proofInputs.merkleProofLength,
                        inputNullifier: proofInputs.inputNullifier,
                        inUnits: proofInputs.inUnits,
                        inPk: proofInputs.inPk,
                        inBlinding: proofInputs.inBlinding,
                        inSigR8: proofInputs.inSigR8,
                        inSigS: proofInputs.inSigS,
                        inLeafIndices: proofInputs.inLeafIndices,
                        merkleProofIndices: proofInputs.merkleProofIndices,
                        merkleProofSiblings: proofInputs.merkleProofSiblings,
                        outCommitment: proofInputs.outCommitment,
                        outUnits: proofInputs.outUnits,
                        outPk: proofInputs.outPk,
                        outBlinding: proofInputs.outBlinding
                    },
                    {
                        merkleRoot: expectedMerkleRoot
                    }
                );
            } else {
                await circuit.expectPass(
                    {    
                        publicVal: proofInputs.publicVal, 
                        signalHash : proofInputs.signalHash, 
                        merkleProofLength: proofInputs.merkleProofLength,
                        inputNullifier: proofInputs.inputNullifier,
                        inUnits: proofInputs.inUnits,
                        inPk: proofInputs.inPk,
                        inBlinding: proofInputs.inBlinding,
                        inSigR8: proofInputs.inSigR8,
                        inSigS: proofInputs.inSigS,
                        inLeafIndices: proofInputs.inLeafIndices,
                        merkleProofIndices: proofInputs.merkleProofIndices,
                        merkleProofSiblings: proofInputs.merkleProofSiblings,
                        outCommitment: proofInputs.outCommitment,
                        outUnits: proofInputs.outUnits,
                        outPk: proofInputs.outPk,
                        outBlinding: proofInputs.outBlinding
                    },
                );
            }
           
        })  
    });
    
    
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

  });
  