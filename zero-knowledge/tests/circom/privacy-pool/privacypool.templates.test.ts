//  bunx jest ./tests/circom/privacy-pool/privacypool.templates.test.ts

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { PrivacyPool, getSignal } from "@privacy-pool-v1/zero-knowledge"
import { generatePrivateKey } from "viem/accounts"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import type {Point} from "@zk-kit/baby-jubjub"
import type {Commitment} from "@privacy-pool-v1/core-ts/domain"
import {
    NewCommitment,
    MerkleTreeInclusionProof,
} from "@privacy-pool-v1/core-ts/domain"
import type {MerkleProofT} from "@privacy-pool-v1/core-ts/zk-circuit"

import { test, describe, beforeAll, afterEach, expect } from "@jest/globals"

function randomBigint(minValue: bigint, maxValue: bigint): bigint {
    const range = maxValue - minValue + 1n // Calculate the range of possible values
    return BigInt(Math.floor(Math.random() * Number(range))) + minValue
}
  

describe("Test Privacy Pool templates", () => {
    const TestSample = 10
    const mt = new LeanIMT(hashLeftRight)
    let secrets:  {
        pKScalar: bigint
        Pk: Point<bigint>
        salt: bigint
        eK: Point<bigint>
        nonce: bigint
      }[] = []
    let commitments: Commitment[] = []
    let mtProofs: MerkleProofT[] = []

    afterEach(async () => {
        await cleanThreads()
    })

    // generate a set of commitments
    // and insert into the merkle tree
    beforeAll( () => {
        const merkleFn = MerkleTreeInclusionProof(mt)

        commitments = Array.from({ length: TestSample }, () => {
            const _out = NewCommitment({
            _pK: generatePrivateKey(),
            _nonce: randomBigint(0n, 1000n),
            _scope: randomBigint(0n, 1000n),
            _value: randomBigint(0n, 1000n)
            })
            mt.insert(_out.commitment.commitmentRoot)
            // confirm mt has the leaf exists
            expect(mt.has(_out.commitment.commitmentRoot)).toBe(true)

            secrets.push(_out.secrets)
            return _out.commitment
        })
        // get merkle proofs for all commitments
        mtProofs = commitments.map((x) => {
            const index = mt.indexOf(x.commitmentRoot)
            return merkleFn(BigInt(index))
        })
    })
    

    test(" HandleExistingCommitment should not reveal commitmentRoot & CommitmentHash, non-zero value and valid nullRoot for all commitments", 
    async () => {
        const witnessTester = await PrivacyPool.circomkit({
            file: "./privacy-pool/privacyPool",
            template: "HandleExistingCommitment",
            params: [32, 7, 4]
        }).witnessTester()

        for (let i = 0; i < TestSample; i++) {
            const _tuple = commitments[i].asTuple()
            const INPUTS = {
                scope : _tuple[1],
                stateRoot: mt.root,
                actualTreeDepth: mtProofs[i].Depth,
                privateKey: secrets[i].pKScalar,
                nonce: secrets[i].nonce,
                saltPublicKey: commitments[i].public().saltPk.map((x) => BigInt(x)),
                ciphertext: commitments[i].public().cipher.map((x) => BigInt(x)),
                index: mtProofs[i].index,
                siblings: mtProofs[i].Siblings.map((x) => BigInt(x))
            }
            const witness = await witnessTester.calculateWitness(INPUTS)
            await witnessTester.expectConstraintPass(witness)
            const nullRoot = await getSignal(witnessTester, witness, "out[0]")
            const commitmentRoot = await getSignal(witnessTester, witness, "out[1]")
            const commitmentHash = await getSignal(witnessTester, witness, "out[2]")
            const value = await getSignal(witnessTester, witness, "out[3]")

            expect(nullRoot).toBe(commitments[i].nullRoot)

            // neither commitment root & hash should be revealed 
            // when commitment is valid.
            expect(commitmentRoot).toBe(0n)
            expect(commitmentHash).toBe(0n)
            expect(value).toBe(_tuple[0])
        }
    }, 100000)

    test("Root mismatch should reveal commitmentRoot & CommitmentHash, zero value and valid nullRoot", 
        async () => {
            const merkleFn = MerkleTreeInclusionProof(mt)

            const witnessTester = await PrivacyPool.circomkit({
                file: "./privacy-pool/privacyPool",
                template: "HandleExistingCommitment",
                params: [32, 7, 4]
            }).witnessTester()
            // cause a root mismatch 
            // value is not 0, therefore not void
            const _c = NewCommitment({
                _pK: generatePrivateKey(),
                _nonce: randomBigint(0n, 1000n),
                _scope: randomBigint(0n, 1000n),
                _value: randomBigint(0n, 1000n)
                })
            
            // insert into tree to get proof
            mt.insert(_c.commitment.commitmentRoot)
            // confirm mt has the leaf exists
            expect(mt.has(_c.commitment.commitmentRoot)).toBe(true)
            const index = mt.indexOf(_c.commitment.commitmentRoot)
             const mtProof = merkleFn(BigInt(index))    

            const _tuple = _c.commitment.asTuple()
            const INPUTS = {
                scope : _tuple[1],
                stateRoot: mt.root - 100n, // alter the state root to invalidate the commitment membership proof
                actualTreeDepth: mtProof.Depth,
                privateKey: _c.secrets.pKScalar,
                nonce: _c.secrets.nonce,
                saltPublicKey: _c.commitment.public().saltPk.map((x) => BigInt(x)),
                ciphertext: _c.commitment.public().cipher.map((x) => BigInt(x)),
                index: mtProof.index,
                siblings: mtProof.Siblings.map((x) => BigInt(x))
            }
            const witness = await witnessTester.calculateWitness(INPUTS)
            await witnessTester.expectConstraintPass(witness)
            const nullRoot = await getSignal(witnessTester, witness, "out[0]")
            const commitmentRoot = await getSignal(witnessTester, witness, "out[1]")
            const commitmentHash = await getSignal(witnessTester, witness, "out[2]")
            const value = await getSignal(witnessTester, witness, "out[3]")

            expect(nullRoot).toBe(_c.commitment.nullRoot)

            // commitment root & hash should be revealed 
            // due to root mismatch and non-void status
            expect(commitmentRoot).toBe(_c.commitment.commitmentRoot)
            expect(commitmentHash).toBe(_c.commitment.hash())
            expect(value).toBe(0n)
        
        }, 100000),

        test("Invalid ownership should have different CommitmentHash, commitmentRoot & nullRoot, and zero value ", 
            async () => {
                const merkleFn = MerkleTreeInclusionProof(mt)
    
                const witnessTester = await PrivacyPool.circomkit({
                    file: "./privacy-pool/privacyPool",
                    template: "HandleExistingCommitment",
                    params: [32, 7, 4]
                }).witnessTester()

                const _c = NewCommitment({
                    _pK: generatePrivateKey(),
                    _nonce: randomBigint(0n, 1000n),
                    _scope: randomBigint(0n, 1000n),
                    _value: randomBigint(0n, 1000n)
                    })
                
                // insert into tree to get proof
                mt.insert(_c.commitment.commitmentRoot)
                // confirm mt has the leaf exists
                expect(mt.has(_c.commitment.commitmentRoot)).toBe(true)
                const index = mt.indexOf(_c.commitment.commitmentRoot)
                 const mtProof = merkleFn(BigInt(index))    
    
                const _tuple = _c.commitment.asTuple()
                const INPUTS = {
                    scope : _tuple[1],
                    stateRoot: mt.root ,
                    actualTreeDepth: mtProof.Depth,
                    privateKey: _c.secrets.pKScalar,
                    nonce: _c.secrets.nonce,
                    saltPublicKey: _c.commitment.public().saltPk.map((x) => BigInt(x) - 100n), // alter the salt Pk to invalidate the ownership
                    ciphertext: _c.commitment.public().cipher.map((x) => BigInt(x)),
                    index: mtProof.index,
                    siblings: mtProof.Siblings.map((x) => BigInt(x))
                }
                const witness = await witnessTester.calculateWitness(INPUTS)
                await witnessTester.expectConstraintPass(witness)
                const nullRoot = await getSignal(witnessTester, witness, "out[0]")
                const commitmentRoot = await getSignal(witnessTester, witness, "out[1]")
                const commitmentHash = await getSignal(witnessTester, witness, "out[2]")
                const value = await getSignal(witnessTester, witness, "out[3]")
    
                expect(nullRoot).not.toBe(_c.commitment.nullRoot)
                expect(commitmentRoot).toBe(0n) // mismatch so commitmentRoot is set to 0 
                expect(commitmentHash).not.toBe(_c.commitment.hash()) // mimsatch as the Ek derived from the incorret saltPk is different.
                expect(value).toBe(0n)
            
            }, 100000)

    test(" HandleNewCommitment should reveal commitmentRoot & CommitmentHash and value but not nullRoot for all commitments", 
    async () => {
        const witnessTester = await PrivacyPool.circomkit({
            file: "./privacy-pool/privacyPool",
            template: "HandleNewCommitment",
            params: [7, 4]
        }).witnessTester()

        for (let i = 0; i < TestSample; i++) {
            const _tuple = commitments[i].asTuple()
            const INPUTS = {
                scope : _tuple[1],
                privateKey: secrets[i].pKScalar,
                nonce: secrets[i].nonce,
                saltPublicKey: commitments[i].public().saltPk.map((x) => BigInt(x)),
                ciphertext: commitments[i].public().cipher.map((x) => BigInt(x))
            }
            const witness = await witnessTester.calculateWitness(INPUTS)
            await witnessTester.expectConstraintPass(witness)
            const nullRoot = await getSignal(witnessTester, witness, "out[0]")
            const commitmentRoot = await getSignal(witnessTester, witness, "out[1]")
            const commitmentHash = await getSignal(witnessTester, witness, "out[2]")
            const value = await getSignal(witnessTester, witness, "out[3]")

            expect(nullRoot).toBe(0n)

            // neither commiment root & hash should be revealed 
            // when commitment is valid.
            expect(commitmentRoot).toBe(commitments[i].commitmentRoot)
            expect(commitmentHash).toBe(commitments[i].hash())
            expect(value).toBe(_tuple[0])
        }
    }, 100000)

    test("Invalid ownership should have different CommitmentHash, commitmentRoot & nullRoot, and zero value ", 
        async () => {
            const witnessTester = await PrivacyPool.circomkit({
                file: "./privacy-pool/privacyPool",
                template: "HandleNewCommitment",
                params: [7, 4]
            }).witnessTester()

            // cause a root mismatch 
            // value is not 0, therefore not void
            const _c = NewCommitment({
                _pK: generatePrivateKey(),
                _nonce: randomBigint(0n, 1000n),
                _scope: randomBigint(0n, 1000n),
                _value: randomBigint(0n, 1000n)
                })
        
            const _tuple = _c.commitment.asTuple()
            const INPUTS = {
                scope : _tuple[1],
                privateKey: _c.secrets.pKScalar,
                nonce: _c.secrets.nonce,
                saltPublicKey: _c.commitment.public().saltPk.map((x) => BigInt(x) -100n), // wrong ownership
                ciphertext: _c.commitment.public().cipher.map((x) => BigInt(x))
            }
            const witness = await witnessTester.calculateWitness(INPUTS)
            await witnessTester.expectConstraintPass(witness)
            const nullRoot = await getSignal(witnessTester, witness, "out[0]")
            const commitmentRoot = await getSignal(witnessTester, witness, "out[1]")
            const commitmentHash = await getSignal(witnessTester, witness, "out[2]")
            const value = await getSignal(witnessTester, witness, "out[3]")

            expect(nullRoot).not.toBe(_c.commitment.nullRoot)
            expect(commitmentRoot).toBe(0n) // wrong ownership so commitmentRoot is set to 0 
            expect(commitmentHash).not.toBe(_c.commitment.hash()) // mimsatch as the Ek derived from the incorret saltPk is different.
            expect(value).toBe(0n)
        
        }, 100000)
})
 