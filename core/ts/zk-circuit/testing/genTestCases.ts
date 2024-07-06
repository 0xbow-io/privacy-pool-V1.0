import type { Commitment } from "@privacy-pool-v1/core-ts/domain"
import type { TPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import { generatePrivateKey } from "viem/accounts"
import { NewCommitment } from "@privacy-pool-v1/core-ts/domain"

function randomBigValue(minValue: bigint, maxValue: bigint): bigint {
  const range = maxValue - minValue + 1n // Calculate the range of possible values
  return BigInt(Math.floor(Math.random() * Number(range))) + minValue
}
import type { Hex } from "viem"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"

import type { TestCaseData } from "./genTestCase"
import { genTestCase } from "./genTestCase"

// Test cases with these variants:
// variant 1: existing => [void,void] , new => [random,void]
// variant 2: existing => [random,void] , new => [random,void]
// variant 3: existing => [random,random] , new => [sum of existing + random,void]
// variant 4: existing => [random,random] , new => [sum of existing, random]
// variant 5: existing => [random,random] , new => [sum of existing - random, void]
// variant 6: existing => [random,random] , new => [existing[0] - random, existing[1] - random]

export const GenTestCases =
  (noTestGroups = 4) =>
  (
    scope = randomBigValue(0n, 1000n),
    stateTree = new LeanIMT(hashLeftRight),
    keys = Array.from({ length: noTestGroups * 4 }, () => generatePrivateKey()),
    commitments: Commitment[] = []
  ) => {
    return Array.from({ length: noTestGroups }, (v, k) => [
      // variant 1: existing => [void,void] , new => [random,void]
      genTestCase(
        "existing => [void,void] , new => [random,void]",
        scope,
        stateTree,
        [keys[0 + k], keys[1 + k], keys[2 + k], keys[3 + k]],
        [BigInt(0 + k), BigInt(1 + k), BigInt(2 + k), BigInt(3 + k)],
        [0n, 0n, randomBigValue(100n, 1000n), 0n],
        [
          [1n, 1n, 0n, 0n],
          [0n, 0n, 1n, 1n],
          [0n, 0n, 1n, 1n]
        ],
        true
      )(),
      // variant 2: existing => [random,void] , new => [random,void]
      genTestCase(
        "existing => [random,void] , new => [random,void]",
        scope,
        stateTree,
        [keys[0 + k], keys[1 + k], keys[2 + k], keys[3 + k]],
        [BigInt(0 + k), BigInt(1 + k), BigInt(2 + k), BigInt(3 + k)],
        [randomBigValue(100n, 1000n), 0n, randomBigValue(100n, 1000n), 0n],
        [
          [1n, 1n, 0n, 0n],
          [0n, 0n, 1n, 1n],
          [0n, 0n, 1n, 1n]
        ],
        true
      )(),
      // variant 3: existing => [random,random] , new => [sum of existing + random,void]
      genTestCase(
        "existing => [random,random] , new => [sum of existing + random,void]",
        scope,
        stateTree,
        [keys[0 + k], keys[1 + k], keys[2 + k], keys[3 + k]],
        [BigInt(0 + k), BigInt(1 + k), BigInt(2 + k), BigInt(3 + k)],
        [100n, 100n, 200n + 100n, 0n],
        [
          [1n, 1n, 0n, 0n],
          [0n, 0n, 1n, 1n],
          [0n, 0n, 1n, 1n]
        ],
        true
      )(),
      // variant 4: existing => [random,random] , new => [sum of existing, random]
      genTestCase(
        "existing => [random,random] , new => [sum of existing, random]",
        scope,
        stateTree,
        [keys[0 + k], keys[1 + k], keys[2 + k], keys[3 + k]],
        [BigInt(0 + k), BigInt(1 + k), BigInt(2 + k), BigInt(3 + k)],
        [100n, 300n, 400n, 50n],
        [
          [1n, 1n, 0n, 0n],
          [0n, 0n, 1n, 1n],
          [0n, 0n, 1n, 1n]
        ],
        true
      )(),
      // variant 5: existing => [random,random] , new => [sum of existing - random, void]
      genTestCase(
        "existing => [random,random] , new => [sum of existing - random, void]",
        scope,
        stateTree,
        [keys[0 + k], keys[1 + k], keys[2 + k], keys[3 + k]],
        [BigInt(0 + k), BigInt(1 + k), BigInt(2 + k), BigInt(3 + k)],
        [100n, 300n, 200n, 0n],
        [
          [1n, 1n, 0n, 0n],
          [0n, 0n, 1n, 1n],
          [0n, 0n, 1n, 1n]
        ],
        true
      )(),
      // variant 6: existing => [random,random] , new => [existing[0] - random, existing[1] - random]
      genTestCase(
        "existing => [random,random] , new => [existing[0] - random, existing[1] - random]",
        scope,
        stateTree,
        [keys[0 + k], keys[1 + k], keys[2 + k], keys[3 + k]],
        [BigInt(0 + k), BigInt(1 + k), BigInt(2 + k), BigInt(3 + k)],
        [100n, 300n, 50n, 200n],
        [
          [1n, 1n, 0n, 0n],
          [0n, 0n, 1n, 1n],
          [0n, 0n, 1n, 1n]
        ],
        true
      )()
    ])
  }
