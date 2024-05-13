import {account} from '@core/account'
import {GetCommitment, GetNullifier, UTXO} from '@core/utxo'
import { LeanIMT } from "@zk-kit/imt"
import {ProofInputs, generateProof} from '@core/pool'

import { hashLeftRight, hash2, stringifyBigInts} from "maci-crypto"

import { WitnessTester, CircuitSignals, Circomkit, CircuitConfig} from 'circomkit';
import {test, expect, before, describe} from "bun:test";

import { createTestClient, http, publicActions, walletActions } from 'viem'

const circomkit = new Circomkit({
    protocol: "groth16",
    prime: "bn128",
    version: "2.1.9",
    verbose: false,
    dirCircuits: "circuits",
    dirBuild: "build",
    dirInputs: "inputs",
    dirPtau: "ptau",
  });


describe("PrivacyPool", () => {

    const acc = new account();
    const keypair = acc.genKeyPair();
    const privKey = keypair.privKey.rawPrivKey
    const pubKey = keypair.pubKey.rawPubKey
    const tree = new LeanIMT(hashLeftRight)
    const maxDepth = 32

    let circuit: WitnessTester<
            // Circuit input signals
            [
                "publicVal", 
                "signalHash", 
                "merkleProofLength",
                "inputNullifier",
                "inUnits",
                "inPk",
                "inSigR8",
                "inSigS",
                "inBlinding",
                "inLeafIndices",
                "merkleProofIndices",
                "merkleProofSiblings",
                "outCommitment",
                "outUnits",
                "outPk",
                "outBlinding"
            ], 
            // Circuit output signals
            [
                "merkleRoot",
            ]
        >;

    /*
        test("testing circuit contract", async () =>  {
            // test local client
            const client = createTestClient({
                account: acc.privateKeyFromPk(keypair.pubKey), 
                chain: foundry,
                mode: 'anvil',
                transport: http(),
            }).extend(publicActions) 
            .extend(walletActions) 

            const [address] = await client.getAddresses()
    
            await client.deployContract(
                { 
                abi, 
                account: address, 
                bytecode, 
            }) 

        })
    */

    test("testing circuit", async () => {
        let proofInputs: ProofInputs = {
            publicVal: 100n,
            signalHash: hash2([100n, 200n]),
            inUnits: [],
            inPk: [
                    [pubKey[0], pubKey[1]], 
                    [pubKey[0], pubKey[1]]
                ],
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
            outPk: [
                [pubKey[0], pubKey[1]], 
                [pubKey[0], pubKey[1]]
            ],
            outBlinding: [],
        }

        // Generate random UTXOs to populate the tree
        for (let i = 0; i < 100; i++) {
            const utxo: UTXO = {
                Pk: keypair.pubKey,
                amount: BigInt(Math.floor(Math.random() * 100)),
                blinding: BigInt(Math.floor(Math.random() * 100)),
                index: BigInt(tree.size),
            }
            const commitment = GetCommitment(utxo)
            tree.insert(commitment)
        }

        // Generate 2 input UTXOs
        proofInputs.inUnits = [100n, 200n]
        proofInputs.inBlinding = [BigInt(Math.floor(Math.random() * 100)), BigInt(Math.floor(Math.random() * 100))]

        const utxos : UTXO[] = Array(2).fill(0).map((_, i) => {
            // Generate 1 input UTXO 
            const utxo: UTXO = {
                Pk: keypair.pubKey,
                amount: proofInputs.inUnits[i],
                blinding: proofInputs.inBlinding[i],
                index: BigInt(tree.size),
            }

            proofInputs.inLeafIndices.push(utxo.index)

            // get commitment
            const commitment = GetCommitment(utxo)
            // insert into tree
            tree.insert(commitment)

            // get account to sign UTXO
            const sig = acc.signUTXO(utxo)

            proofInputs.inSigR8.push([sig.R8[0] as bigint, sig.R8[1]  as bigint])
            proofInputs.inSigS.push(sig.S  as bigint)


            // get nullifier for UTXO 
            const nullifier = GetNullifier(utxo, sig)
            proofInputs.inputNullifier.push(nullifier)  

            expect(commitment > 0n).toBe(true);
            expect(nullifier > 0n).toBe(true);
            return utxo
        });

        utxos.forEach((utxo, i) => {
        const proof = tree.generateProof(Number(utxo.index))

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
        })


        // Generate 1 Output UTXO that has a value of the input UTXOS + publicval 
        const outputUtxo1: UTXO = {
            Pk: keypair.pubKey,
            amount: proofInputs.inUnits[0] + proofInputs.inUnits[1] + proofInputs.publicVal,
            blinding: BigInt(Math.floor(Math.random() * 100)),
            index: BigInt(tree.size),
        }
        proofInputs.outCommitment.push(GetCommitment(outputUtxo1))
        proofInputs.outBlinding.push(outputUtxo1.blinding) 

        // Generate 1 Output UTXO that has a value of 0 
        const outputUtxo2: UTXO = {
            Pk: keypair.pubKey,
            amount: 0n,
            blinding: BigInt(Math.floor(Math.random() * 100)),
            index: BigInt(tree.size),
        }

        proofInputs.outCommitment.push(GetCommitment(outputUtxo2))
        proofInputs.outBlinding.push(outputUtxo2.blinding)
        proofInputs.outUnits = [proofInputs.inUnits[0] + proofInputs.inUnits[1] + proofInputs.publicVal, 0n]

        console.log(stringifyBigInts(proofInputs))
        
        circuit = await circomkit.WitnessTester(`privacyPool`, {
            file: "privacyPool",
            template: "PrivacyPool",
            pubs: [ 
                "publicVal",
                "signalHash",
                "merkleProofLength",
                "inputNullifier",
                "outCommitment"
            ],
            params: [maxDepth, 2, 2],
        });

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
                merkleRoot: tree.root
            }
        );

       
    });

    test("testing build", async () => {

        console.log("cleaning artifacts...")
        await circomkit.clean("privacyPool")

        console.log("compiling circuit...")
        await circomkit.compile("privacyPool")
        
        console.log("instantiate circuit...")
        circomkit.instantiate("privacyPool")
        
        let rc1sInfo = await circomkit.info("privacyPool")
        console.log("circuit rc1sInfo: ", rc1sInfo)

        console.log("setting up privacyPool circuits...")
        await circomkit.setup("privacyPool", "ptau/powersOfTau28_hez_final.ptau")

        console.log("generating test proof...")
        await circomkit.prove("privacyPool", "default")
        console.log("verifying test proof...")
        await circomkit.verify("privacyPool", "default")

        console.log("generating GROTH16 verifier contract...")
        await circomkit.contract("privacyPool")

        let calldata = await circomkit.calldata(
            "privacyPool",
            "default",
        )
        console.log("test calldata: ", calldata)


    });
  });
  