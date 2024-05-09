import {account, keypair} from '@core/account'
import {GetCommitment, GetNullifier, UTXO} from '../utxo'
import { LeanIMT } from "@zk-kit/imt"
import { poseidon2 } from "poseidon-lite"
import {ProofInputs} from '@core/pool'


const hash = (a: bigint, b: bigint) => poseidon2([a, b])


describe('testUTXO', () => {
    test('commiting utxos', async () => {
        const acc = new account();
        const Pk = acc.genKeyPair();
        const pK = acc.pKFromPkBigInt(Pk)
        const tree = new LeanIMT(hash)
        const proofInputs : ProofInputs = {}
        const maxDepth = 20
        
        // Generate random UTXOs to populate the tree
       for (let i = 0; i < 100; i++) {
            const utxo: UTXO = {
                Pk: Pk,
                amount: BigInt(Math.floor(Math.random() * 100)),
                blinding: BigInt(Math.floor(Math.random() * 100)),
                index: BigInt(tree.size),
            }
            const commitment = GetCommitment(utxo)
            tree.insert(commitment)
        }

        // Generate 2 input UTXOs
        proofInputs.inUnits = [100n, 200n]
        proofInputs.inpK = [pK, pK]
        proofInputs.inBlinding = [BigInt(Math.floor(Math.random() * 100)), BigInt(Math.floor(Math.random() * 100))]
        
        const utxos : UTXO[] = Array(2).fill(0).map((_, i) => {
            // Generate 1 input UTXO 
            const utxo: UTXO = {
                Pk: Pk,
                amount: proofInputs.inUnits[i],
                blinding: proofInputs.inBlinding[i],
                index: BigInt(tree.size),
            }

            // get commitment
            const commitment = GetCommitment(utxo)
            // insert into tree
            tree.insert(commitment)

            // get account to sign UTXO
            const sig = acc.signUTXO(utxo)

            // get nullifier for UTXO 
            const nullifier = GetNullifier(utxo, sig)
            proofInputs.inputNullifier.push(nullifier)  

            expect(commitment > 0n).toBe(true);
            expect(nullifier > 0n).toBe(true);
            return utxo
        });

        // Get merkle proofs for the 2 input UTXOs
        const inProofs = utxos.map((utxo, i) => {
            return tree.generateProof(Number(utxo.index))
        })

        const merkleProofIndices: number[][] = inProofs.map((proof) => {
            const indices: number[] = []
            let index = proof.index
            for (let i = 0; i < maxDepth; i += 1) {
                indices.push((index >> i) & 1)
                if (merkleProofSiblings[i] === undefined) {
                    merkleProofSiblings[i] = []
                }
            }
            return indices
        });





    });
  });
  