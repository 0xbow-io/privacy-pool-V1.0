// run test with:
// bunx jest ./tests/circom/privacy-pool/domain.stateTree.test.ts

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { generatePrivateKey } from "viem/accounts"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import {
  NewCommitment,
  MerkleTreeInclusionProof
} from "@privacy-pool-v1/domainobjs"
import type { InclusionProofT } from "@privacy-pool-v1/domainobjs"

import { test, describe, afterEach, expect, beforeAll } from "@jest/globals"
import type { WitnessTester } from "circomkit"

function randomBigint(minValue: bigint, maxValue: bigint): bigint {
  const range = maxValue - minValue + 1n // Calculate the range of possible values
  return BigInt(Math.floor(Math.random() * Number(range))) + minValue
}

describe("Testing MerkleTreeInclusionProof", () => {
  const mt = new LeanIMT(hashLeftRight)
  const merkleFn = MerkleTreeInclusionProof(mt)

  const cycles = 100
  const leaves: bigint[] = []
  const inclusionProofs: InclusionProofT[] = []

  let circuit: WitnessTester<
    ["leaf", "leafIndex", "siblings", "actualDepth"],
    ["out"]
  >

  afterEach(async () => {
    await cleanThreads()
  })

  beforeAll(async () => {
    circuit = await PrivacyPool.circomkit({
      file: "./domain/stateTree",
      template: "LeanIMTInclusionProof",
      params: [32]
    }).witnessTester()

    // insert a batch of 4 at a time
    // since we are pushing the commitmentRoot & nullroot
    for (let i = 0; i < cycles; i++) {
      const c = Array.from({ length: 2 }, () => {
        const _c = NewCommitment({
          _pK: generatePrivateKey(),
          _nonce: BigInt(i),
          _scope: randomBigint(0n, 1000n),
          _value: randomBigint(0n, 1000n)
        })
        leaves.push(_c.commitmentRoot)
        leaves.push(_c.nullRoot)

        return [_c.commitmentRoot, _c.nullRoot]
      }).flat()

      // Insert into merkle tree
      mt.insertMany(c)
    }
  })

  test("locally generated proof should be valid", () => {
    for (let i = 0; i < cycles; i++) {
      const proof = merkleFn(mt.indexOf(leaves[i]))
      expect(
        mt.verifyProof({
          root: proof.root,
          leaf: leaves[i],
          index: proof.index,
          siblings: proof.siblings.slice(0, Number(proof.actualDepth))
        })
      ).toBe(true)
    }
  })

  test("LeanIMTInclusionProof should compute correct root", async () => {
    for (let i = 0; i < cycles; i++) {
      const proof = merkleFn(mt.indexOf(leaves[i]))

      const INPUT = {
        leaf: leaves[i],
        leafIndex: proof.index,
        siblings: proof.siblings,
        actualDepth: proof.actualDepth
      }

      const witness = await circuit.calculateWitness(INPUT)
      await circuit.expectConstraintPass(witness)
      await circuit.expectPass(INPUT, { out: proof.root })
    }
  })
})
