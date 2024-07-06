//  bunx jest ./tests/circom/privacy-pool/privacypool.test.ts

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { GenTestCases } from "@privacy-pool-v1/core-ts/zk-circuit"
import { test, describe, beforeAll, afterEach } from "@jest/globals"
import type { WitnessTester } from "circomkit"

describe("Test Privacy Pool template ", () => {
  const tcs = GenTestCases()()

  let circuit: WitnessTester<
    [
      "scope",
      "actualTreeDepth",
      "context",
      "externIO",
      "newSaltPublicKey",
      "newCiphertext",
      "PrivateKey",
      "Nonce",
      "ExSaltPublicKey",
      "ExCiphertext",
      "ExIndex",
      "ExSiblings"
    ],
    ["newNullRoot", "newCommitmentRoot", "newCommitmentHash"]
  >

  afterEach(async () => {
    await cleanThreads()
  })

  // generate a set of commitments
  // and insert into the merkle tree
  beforeAll(async () => {
    circuit = await PrivacyPool.circomkit({
      file: "./privacy-pool/privacyPool",
      template: "PrivacyPool",
      params: [32, 7, 4, 2, 2],
      pubs: [
        "scope",
        "actualTreeDepth",
        "externIO",
        "existingStateRoot",
        "newSaltPublicKey",
        "newCiphertext"
      ]
    }).witnessTester()
  })

  //tvariant1
  test(tcs[0][0].case, async () => {
    for (const tvariant of tcs) {
      console.log("Test case: ", tvariant[0])
      const witness = await circuit.calculateWitness(tvariant[0].inputs)
      await circuit.expectConstraintPass(witness)
      await circuit.expectPass(tvariant[0].inputs, tvariant[0].expectedOutputs)
    }
  })

  //tvariant2
  test(tcs[0][1].case, async () => {
    for (const tvariant of tcs) {
      console.log("Test case: ", tvariant[1])
      const witness = await circuit.calculateWitness(tvariant[1].inputs)
      await circuit.expectConstraintPass(witness)
      await circuit.expectPass(tvariant[1].inputs, tvariant[1].expectedOutputs)
    }
  })
})
