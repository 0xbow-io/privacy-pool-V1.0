import fs from "node:fs"
import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"
import {
  CreateCommitment,
  CreatePrivacyKey
} from "@privacy-pool-v1/core-ts/account"

import type { PrivacyKey } from "@privacy-pool-v1/core-ts/account"

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"

import { LeanIMT } from "@zk-kit/lean-imt"
import { poseidon2 } from "poseidon-lite"
import {
  PrivacyPool,
  genTestCircuitInputsFn
} from "@privacy-pool-v1/zero-knowledge"

import type {
  ICircuit,
  TPrivacyPool,
  Groth16_VKeyJSONT,
  CircomArtifactT,
  CircomOutputT
} from "@privacy-pool-v1/core-ts/zk-circuit"

import {
  NewPrivacyPoolCircuit,
  FnPrivacyPool
} from "@privacy-pool-v1/core-ts/zk-circuit"

// function will generate 2 input amounts & 2 output amounts
const generateTestAmounts = (
  numOfElements: number,
  minValue: bigint,
  maxValue: bigint
): bigint[][] => {
  if (numOfElements < 0) {
    throw new Error("numOfElements must be a non-negative number")
  }

  if (minValue < 0 || maxValue < 0) {
    throw new Error("values must be a non-negative number")
  }

  if (minValue >= maxValue) {
    throw new Error("minValue must be less than maxValue")
  }

  const range = maxValue - minValue + 1n // Calculate the range of possible values

  return Array.from({ length: numOfElements }, () => {
    return [
      BigInt(Math.floor(Math.random() * Number(range))) + minValue,
      BigInt(Math.floor(Math.random() * Number(range))) + minValue,
      BigInt(Math.floor(Math.random() * Number(range))) + minValue,
      BigInt(Math.floor(Math.random() * Number(range))) + minValue
    ]
  })
}

const genTestData =
  (numberOfTests = 10, keys?: PrivacyKey[], mt?: LeanIMT) =>
  (
    minValue = 0n,
    maxValue = 500n,
    _keys = keys
      ? keys
      : Array.from({ length: numberOfTests }, () => CreatePrivacyKey()),
    _mt = mt ? mt : new LeanIMT((a, b) => poseidon2([a, b]))
  ) => {
    // generate random set of keys
    return generateTestAmounts(numberOfTests, minValue, maxValue).map(
      (values) => {
        return {
          mt: _mt,
          maxDepth: 32,
          // create input commitments
          // with randomly selected keys
          inputs: [0, 1].map((i) => {
            const commitment = CreateCommitment(
              _keys[Math.floor(Math.random() * _keys.length)],
              {
                value: values[i]
              }
            )
            // only inert into the tree if it's not a dummy commitment
            if (!commitment.isDummy) {
              // insert it into the tree so we can generate merkle proofs
              _mt.insert(commitment.hash())
              commitment.index = BigInt(_mt.size - 1)
            }
            return commitment
          }),

          // create output commitments
          // with randomly selected keys
          outputs: [
            CreateCommitment(_keys[Math.floor(Math.random() * _keys.length)], {
              value: values[2]
            }),
            CreateCommitment(_keys[Math.floor(Math.random() * _keys.length)], {
              value: values[3]
            })
          ],
          scope: 100n
        }
      }
    )
  }

describe("Testing CPrivacyPool", () => {
  const testData = genTestData(10)()

  describe("should pass with file paths", () => {
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
    const privacyPool = NewPrivacyPoolCircuit({
      vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
      wasm: paths.WASM_PATH,
      zKey: paths.ZKEY_PATH
    })

    beforeAll(async () => {})

    afterEach(async () => {
      await cleanThreads()
    })

    test.each(testData)(
      "should compute verifiable output for %s",
      async (test) => {
        // generate proof for test data
        // since verify defaults to true, this will
        // auto verify the proof
        // we also will pass down a callback function to
        // the verifier to evaluate the output
        const ok = await privacyPool
          .prove(test)(async ({ out }) => {
            expect(out).toBeDefined()
            console.log("computed output: ", out)
            return true
          })
          .catch((e) => {
            console.error(e)
          })
        expect(ok).toEqual(true)
      }
    )
  })
})
