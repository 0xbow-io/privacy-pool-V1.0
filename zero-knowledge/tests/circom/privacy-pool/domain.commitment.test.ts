// run test with:
// bunx jest ./tests/circom/privacy-pool/domain.commitment.test.ts

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { PrivacyPool, getSignal } from "@privacy-pool-v1/zero-knowledge"
import { generatePrivateKey } from "viem/accounts"
import type { Hex } from "viem"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import {
  NewCommitment,
  MerkleTreeInclusionProof,
  DerivePrivacyKeys
} from "@privacy-pool-v1/core-ts/domain"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import type { CipherText } from "@zk-kit/poseidon-cipher"

import { test, describe, afterEach, expect } from "@jest/globals"

function randomBigint(minValue: bigint, maxValue: bigint): bigint {
  const range = maxValue - minValue + 1n // Calculate the range of possible values
  return BigInt(Math.floor(Math.random() * Number(range))) + minValue
}

describe("Test CommitmentOwnershipProof template", () => {
  afterEach(async () => {
    await cleanThreads()
  })

  test("RecoverCommitmentKeys should recover the correct keys for %s", async () => {
    const _pK: Hex = generatePrivateKey()

    const witnessTester = await PrivacyPool.circomkit({
      file: "./domain/commitment",
      template: "RecoverCommitmentKeys"
    }).witnessTester()

    const keys = DerivePrivacyKeys(_pK)()

    const witness = await witnessTester.calculateWitness({
      privateKey: keys.pKScalar,
      saltPublicKey: keys.SaltPk.map((x) => BigInt(x))
    })

    await witnessTester.expectConstraintPass(witness)
    const publicKey_x = await getSignal(witnessTester, witness, "publicKey[0]")
    const publicKey_y = await getSignal(witnessTester, witness, "publicKey[1]")
    const secretKey_x = await getSignal(witnessTester, witness, "secretKey[0]")
    const secretKeyh_y = await getSignal(witnessTester, witness, "secretKey[1]")
    const encryptionKey_x = await getSignal(
      witnessTester,
      witness,
      "encryptionKey[0]"
    )
    const encryptionKey_y = await getSignal(
      witnessTester,
      witness,
      "encryptionKey[1]"
    )

    console.log(
      "original keys: ",
      keys,
      " publicKey: ",
      [publicKey_x, publicKey_y],
      " secretKey: ",
      [secretKey_x, secretKeyh_y],
      " encryptionKey: ",
      [encryptionKey_x, encryptionKey_y]
    )

    expect(publicKey_x).toBe(keys.Pk[0])
    expect(publicKey_y).toBe(keys.Pk[1])
    expect(secretKey_x).toBe(keys.secret[0])
    expect(secretKeyh_y).toBe(keys.secret[1])
    expect(encryptionKey_x).toBe(keys.eK[0])
    expect(encryptionKey_y).toBe(keys.eK[1])
  })

  test("CommitmentOwnershipProof should prove  %s", async () => {
    const _pK: Hex = generatePrivateKey()
    const _nonce = randomBigint(0n, 1000n)

    const witnessTester = await PrivacyPool.circomkit({
      file: "./domain/commitment",
      template: "CommitmentOwnershipProof",
      params: [7, 4]
    }).witnessTester()

    const c = NewCommitment({
      _pK: _pK,
      _nonce: _nonce,
      _scope: randomBigint(0n, 1000n),
      _value: randomBigint(0n, 1000n)
    })
    const INPUTS = {
      scope: c.public().scope as bigint,
      privateKey: deriveSecretScalar(_pK),
      saltPublicKey: c.public().saltPk as [bigint, bigint],
      nonce: _nonce,
      ciphertext: c.public().cipher as CipherText<bigint>
    }

    const _tuple = c.asTuple()
    const hash = c.hash()

    const witness = await witnessTester.calculateWitness(INPUTS)
    await witnessTester.expectConstraintPass(witness)
    const value = await getSignal(witnessTester, witness, "value")
    const nullRoot = await getSignal(witnessTester, witness, "nullRoot")
    const commitmentRoot = await getSignal(
      witnessTester,
      witness,
      "commitmentRoot"
    )
    const commitmentHash = await getSignal(
      witnessTester,
      witness,
      "commitmentHash"
    )

    console.log(
      "inputs: ",
      INPUTS,
      " nullRoot: ",
      nullRoot,
      " commitmentRoot: ",
      commitmentRoot,
      " commitmentHash: ",
      commitmentHash
    )

    expect(value).toBe(_tuple[0])
    expect(nullRoot).toBe(c.nullRoot)
    expect(commitmentRoot).toBe(c.commitmentRoot)
    expect(commitmentHash).toBe(hash)
  })
  test("CommitmentMembershipProof should pass for %s", async () => {
    const TestSample = 10
    const mt = new LeanIMT(hashLeftRight)
    const merkleFn = MerkleTreeInclusionProof(mt)

    const commitments = Array.from({ length: TestSample }, () => {
      const c = NewCommitment({
        _pK: generatePrivateKey(),
        _nonce: randomBigint(0n, 1000n),
        _scope: randomBigint(0n, 1000n),
        _value: randomBigint(0n, 1000n)
      })
      mt.insert(c.commitmentRoot)
      // confirm mt has the leaf exists
      expect(mt.has(c.commitmentRoot)).toBe(true)
      return c
    })

    for (let i = 0; i < TestSample; i++) {
      const witnessTester = await PrivacyPool.circomkit({
        file: "./domain/commitment",
        template: "CommitmentMembershipProof",
        params: [32]
      }).witnessTester()

      const index = mt.indexOf(commitments[i].commitmentRoot)
      const proof = merkleFn(BigInt(index))
      const INPUTS = {
        actualTreeDepth: proof.Depth,
        commitmentRoot: commitments[i].commitmentRoot,
        index: proof.index,
        siblings: proof.Siblings.map((x) => BigInt(x))
      }
      const witness = await witnessTester.calculateWitness(INPUTS)
      await witnessTester.expectConstraintPass(witness)
      const root = await getSignal(witnessTester, witness, "root")
      expect(root).toBe(proof.Root)
    }
  }, 1000000)
})
