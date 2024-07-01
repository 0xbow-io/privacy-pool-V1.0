//  bunx jest ./tests/circom/privacy-pool/domain.commitment.test.ts

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { PrivacyPool, getSignal } from "@privacy-pool-v1/zero-knowledge"
import { generatePrivateKey } from "viem/accounts"
import type { Hex } from "viem"
import type { Commitment } from "@privacy-pool-v1/core-ts/domain"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import {
    NewCommitment,
    MerkleTreeInclusionProof
  } from "@privacy-pool-v1/core-ts/domain"
  
import { test, describe, afterEach, expect } from "@jest/globals"

function randomBigint(minValue: bigint, maxValue: bigint): bigint {
    const range = maxValue - minValue + 1n // Calculate the range of possible values
    return BigInt(Math.floor(Math.random() * Number(range))) + minValue
  }
  

describe("Test CommitmentOwnershipProof template", () => {
    const _pK: Hex = generatePrivateKey()

  afterEach(async () => {
    await cleanThreads()
  })

  test("VerifyCommitmentOwnership should pass for %s", async () => {
    const witnessTester = await PrivacyPool.circomkit({
        file: "./domain/commitment",
        template: "CommitmentOwnershipProof",
    }).witnessTester()

    const out = NewCommitment({
        _pK: _pK,
        _nonce: randomBigint(0n, 1000n),
        _scope: randomBigint(0n, 1000n),
        _value: randomBigint(0n, 1000n)
        })
    const INPUTS = {
        privateKey: out.secrets.pKScalar,
        nonce: out.secrets.nonce,
        saltPublicKey:  out.commitment._public.saltPk.map((x) => BigInt(x)),
        ciphertext: out.commitment._public.cipher.map((x) => BigInt(x)),
    }

    const _tuple = out.commitment.asTuple()

    const witness = await witnessTester.calculateWitness(INPUTS)
    await witnessTester.expectConstraintPass(witness)
    const value = await getSignal(witnessTester, witness, "value")
    const scope = await getSignal(witnessTester, witness, "scope")
    const commitmentRoot = await getSignal(witnessTester, witness, "commitmentRoot")
    const nullRoot = await getSignal(witnessTester, witness, "nullRoot")

    console.log("inputs: ", INPUTS, " value: ", value, " scope: ", scope,  "commitmentRoot: ", commitmentRoot, " nullRoot", nullRoot,  " _tuple: ", _tuple)

    expect(commitmentRoot).not.toBe(nullRoot)
    expect(nullRoot).toBe(out.commitment.nullRoot)
    expect(commitmentRoot).toBe(out.commitment.commitmentRoot)
    expect(value).toBe(_tuple[0])
    expect(scope).toBe(_tuple[1])
  })

  test("CommitmentMembershipProof should pass for %s", async () => {
    const TestSample = 100
    const mt = new LeanIMT(hashLeftRight)
    const merkleFn = MerkleTreeInclusionProof(mt)

    const witnessTester = await PrivacyPool.circomkit({
        file: "./domain/commitment",
        template: "CommitmentMembershipProof",
        params: [32]
    }).witnessTester()

    const commitments = Array.from({ length: TestSample }, () => {
      const _out = NewCommitment({
        _pK: generatePrivateKey(),
        _nonce: randomBigint(0n, 1000n),
        _scope: randomBigint(0n, 1000n),
        _value: randomBigint(0n, 1000n)
        })
      mt.insert(_out.commitment.commitmentRoot)
      // confirm mt has the leaf exists
      expect(mt.has(_out.commitment.commitmentRoot)).toBe(true)
      return _out.commitment
    })


    // generate the merkle proofs  & verify them with the circuit
    commitments.forEach(async (c) => {
      const index = mt.indexOf(c.commitmentRoot)
      const proof = merkleFn(BigInt(index))
      const INPUTS = {
        commitmentRoot: c.commitmentRoot,
        index: proof.index,
        stateRoot:  proof.Root,
        siblings: proof.Siblings.map((x) => BigInt(x)),
        actualTreeDepth: proof.Depth
      }
      const witness = await witnessTester.calculateWitness(INPUTS)
      await witnessTester.expectConstraintPass(witness)
    })
  })
})
