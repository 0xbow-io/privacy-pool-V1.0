//  bunx jest ./tests/circom/privacy-pool/privacypool.test.ts

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import {
  PrivacyPool,
  getSignal,
  getSignals
} from "@privacy-pool-v1/zero-knowledge"
import { generatePrivateKey } from "viem/accounts"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import type { Point } from "@zk-kit/baby-jubjub"
import type { Commitment } from "@privacy-pool-v1/core-ts/domain"
import {
  NewCommitment,
  MerkleTreeInclusionProof
} from "@privacy-pool-v1/core-ts/domain"
import type { MerkleProofT } from "@privacy-pool-v1/core-ts/zk-circuit"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import { test, describe, beforeAll, afterEach, expect } from "@jest/globals"
import type { WitnessTester } from "circomkit"

function randomBigint(minValue: bigint, maxValue: bigint): bigint {
  const range = maxValue - minValue + 1n // Calculate the range of possible values
  return BigInt(Math.floor(Math.random() * Number(range))) + minValue
}

describe("Test Privacy Pool template=", () => {
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

  const TestSample = 10
  const mt = new LeanIMT(hashLeftRight)
  const commitments: Commitment[] = []
  let mtProofs: MerkleProofT[] = []
  const scope = randomBigint(0n, 1000n)
  const keys = Array.from({ length: TestSample }, () => generatePrivateKey())

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

    const merkleFn = MerkleTreeInclusionProof(mt)
    for (let i = 0; i < TestSample; i++) {
      const c = NewCommitment({
        _pK: keys[i],
        _nonce: BigInt(i),
        _scope: scope,
        _value: randomBigint(0n, 1000n)
      })
      mt.insert(c.commitmentRoot)
      // confirm mt has the leaf exists
      expect(mt.has(c.commitmentRoot)).toBe(true)
      c.index = BigInt(mt.indexOf(c.commitmentRoot))
      commitments.push(c)
    }

    // get merkle proofs for all commitments
    mtProofs = commitments.map((x) => {
      return merkleFn(BigInt(x.index))
    })
  })

  test("Main PrivacyPool Template: existing => [void,void] , new => [100,void]", async () => {
    const args = FnPrivacyPool.getCircuitInFn({
      scope: scope,
      context: 100n,
      mt: mt,
      maxDepth: 32,
      pkScalars: [
        deriveSecretScalar(keys[0]),
        deriveSecretScalar(keys[1]),
        deriveSecretScalar(keys[2]),
        deriveSecretScalar(keys[3])
      ],
      nonces: [0n, 1n, 2n, 3n],
      existing: [
        NewCommitment({
          _pK: keys[0],
          _nonce: BigInt(0),
          _scope: scope,
          _value: 0n
        }),
        NewCommitment({
          _pK: keys[1],
          _nonce: BigInt(1),
          _scope: scope,
          _value: 0n
        })
      ],
      new: [
        NewCommitment({
          _pK: keys[2],
          _nonce: BigInt(2),
          _scope: scope,
          _value: 100n
        }),
        // void
        NewCommitment({
          _pK: keys[3],
          _nonce: BigInt(3),
          _scope: scope,
          _value: 0n
        })
      ]
    })()

    const witness = await circuit.calculateWitness(args.inputs)
    await circuit.expectConstraintPass(witness)
    await circuit.expectPass(args.inputs, {
      newNullRoot: [
        args.expectedOut.newNullRoot[0],
        args.expectedOut.newNullRoot[1],
        0n,
        0n
      ],
      newCommitmentRoot: [
        args.expectedOut.newCommitmentRoot[0],
        args.expectedOut.newCommitmentRoot[1],
        args.expectedOut.newCommitmentRoot[2],
        args.expectedOut.newCommitmentRoot[3]
      ],
      newCommitmentHash: [
        args.expectedOut.newCommitmentHash[0],
        args.expectedOut.newCommitmentHash[1],
        args.expectedOut.newCommitmentHash[2],
        args.expectedOut.newCommitmentHash[3]
      ]
    })
  }, 100000)

  test("Main PrivacyPool Template: existing => [non-void,void] , new => [100,void]", async () => {
    const args = FnPrivacyPool.getCircuitInFn({
      scope: scope,
      context: 100n,
      mt: mt,
      maxDepth: 32,
      pkScalars: [
        deriveSecretScalar(keys[0]),
        deriveSecretScalar(keys[1]),
        deriveSecretScalar(keys[2]),
        deriveSecretScalar(keys[3])
      ],
      nonces: [0n, 1n, 2n, 3n],
      existing: [
        commitments[0],
        NewCommitment({
          _pK: keys[1],
          _nonce: BigInt(1),
          _scope: scope,
          _value: 0n
        })
      ],
      new: [
        NewCommitment({
          _pK: keys[2],
          _nonce: BigInt(2),
          _scope: scope,
          _value: 100n
        }),
        // void
        NewCommitment({
          _pK: keys[3],
          _nonce: BigInt(3),
          _scope: scope,
          _value: 0n
        })
      ]
    })()

    const witness = await circuit.calculateWitness(args.inputs)
    await circuit.expectConstraintPass(witness)
    await circuit.expectPass(args.inputs, {
      newNullRoot: [
        args.expectedOut.newNullRoot[0],
        args.expectedOut.newNullRoot[1],
        0n,
        0n
      ],
      newCommitmentRoot: [
        0n,
        args.expectedOut.newCommitmentRoot[1],
        args.expectedOut.newCommitmentRoot[2],
        args.expectedOut.newCommitmentRoot[3]
      ],
      newCommitmentHash: [
        0n,
        args.expectedOut.newCommitmentHash[1],
        args.expectedOut.newCommitmentHash[2],
        args.expectedOut.newCommitmentHash[3]
      ]
    })
  }, 100000)
  test("Main PrivacyPool Template: existing => [non-void,non-void] , new => [sum of existing + 100n,void]", async () => {
    const args = FnPrivacyPool.getCircuitInFn({
      scope: scope,
      context: 100n,
      mt: mt,
      maxDepth: 32,
      pkScalars: [
        deriveSecretScalar(keys[0]),
        deriveSecretScalar(keys[1]),
        deriveSecretScalar(keys[2]),
        deriveSecretScalar(keys[3])
      ],
      nonces: [0n, 1n, 2n, 3n],
      existing: [commitments[0], commitments[1]],
      new: [
        NewCommitment({
          _pK: keys[2],
          _nonce: BigInt(2),
          _scope: scope,
          _value:
            commitments[0].asTuple()[0] + commitments[1].asTuple()[0] + 100n
        }),
        // void
        NewCommitment({
          _pK: keys[3],
          _nonce: BigInt(3),
          _scope: scope,
          _value: 0n
        })
      ]
    })()

    const witness = await circuit.calculateWitness(args.inputs)
    await circuit.expectConstraintPass(witness)
    await circuit.expectPass(args.inputs, {
      newNullRoot: [
        args.expectedOut.newNullRoot[0],
        args.expectedOut.newNullRoot[1],
        0n,
        0n
      ],
      newCommitmentRoot: [
        0n,
        0n,
        args.expectedOut.newCommitmentRoot[2],
        args.expectedOut.newCommitmentRoot[3]
      ],
      newCommitmentHash: [
        0n,
        0n,
        args.expectedOut.newCommitmentHash[2],
        args.expectedOut.newCommitmentHash[3]
      ]
    })
  }, 100000)
  test("Main PrivacyPool Template: existing => [non-void,non-void] , new => [sum of existing,100n]", async () => {
    const args = FnPrivacyPool.getCircuitInFn({
      scope: scope,
      context: 100n,
      mt: mt,
      maxDepth: 32,
      pkScalars: [
        deriveSecretScalar(keys[0]),
        deriveSecretScalar(keys[1]),
        deriveSecretScalar(keys[2]),
        deriveSecretScalar(keys[3])
      ],
      nonces: [0n, 1n, 2n, 3n],
      existing: [commitments[0], commitments[1]],
      new: [
        NewCommitment({
          _pK: keys[2],
          _nonce: BigInt(2),
          _scope: scope,
          _value: commitments[0].asTuple()[0] + commitments[1].asTuple()[0]
        }),
        // void
        NewCommitment({
          _pK: keys[3],
          _nonce: BigInt(3),
          _scope: scope,
          _value: 100n
        })
      ]
    })()

    const witness = await circuit.calculateWitness(args.inputs)
    await circuit.expectConstraintPass(witness)
    await circuit.expectPass(args.inputs, {
      newNullRoot: [
        args.expectedOut.newNullRoot[0],
        args.expectedOut.newNullRoot[1],
        0n,
        0n
      ],
      newCommitmentRoot: [
        0n,
        0n,
        args.expectedOut.newCommitmentRoot[2],
        args.expectedOut.newCommitmentRoot[3]
      ],
      newCommitmentHash: [
        0n,
        0n,
        args.expectedOut.newCommitmentHash[2],
        args.expectedOut.newCommitmentHash[3]
      ]
    })
  }, 100000)
  test("Main PrivacyPool Template: existing => [non-void,non-void] , new => [void, void]", async () => {
    const args = FnPrivacyPool.getCircuitInFn({
      scope: scope,
      context: 100n,
      mt: mt,
      maxDepth: 32,
      pkScalars: [
        deriveSecretScalar(keys[0]),
        deriveSecretScalar(keys[1]),
        deriveSecretScalar(keys[2]),
        deriveSecretScalar(keys[3])
      ],
      nonces: [0n, 1n, 2n, 3n],
      existing: [commitments[0], commitments[1]],
      new: [
        NewCommitment({
          _pK: keys[2],
          _nonce: BigInt(2),
          _scope: scope,
          _value: 0n
        }),
        // void
        NewCommitment({
          _pK: keys[3],
          _nonce: BigInt(3),
          _scope: scope,
          _value: 100n
        })
      ]
    })()

    const witness = await circuit.calculateWitness(args.inputs)
    await circuit.expectConstraintPass(witness)
    await circuit.expectPass(args.inputs, {
      newNullRoot: [
        args.expectedOut.newNullRoot[0],
        args.expectedOut.newNullRoot[1],
        0n,
        0n
      ],
      newCommitmentRoot: [
        0n,
        0n,
        args.expectedOut.newCommitmentRoot[2],
        args.expectedOut.newCommitmentRoot[3]
      ],
      newCommitmentHash: [
        0n,
        0n,
        args.expectedOut.newCommitmentHash[2],
        args.expectedOut.newCommitmentHash[3]
      ]
    })
  }, 100000)
})
