import fs from "node:fs"
import type {
  CircomArtifactT,
  CircomOutputT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import type { Commitment, PrivacyKey } from "@privacy-pool-v1/core-ts/account"
import {
  CreateCommitment,
  CreatePrivacyKey
} from "@privacy-pool-v1/core-ts/account"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"

import { expect, test, describe, beforeEach, afterEach } from "@jest/globals"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"

function getTestDummyCommimtment(pK: PrivacyKey): Commitment {
  return CreateCommitment(pK, { value: 0n })
}
function genTestCommitment(value: bigint, pK: PrivacyKey): Commitment {
  return CreateCommitment(pK, { value: value })
}
function genTestCommitments(
  specs: { value: bigint; pK: PrivacyKey }[]
): Commitment[] {
  return specs.map((spec) => genTestCommitment(spec.value, spec.pK))
}

describe("Test Functions", () => {
  describe("Test MerkleProofFn", () => {
    let mt: LeanIMT
    beforeEach(() => {
      mt = new LeanIMT(hashLeftRight)
      // insert commitments
      for (let i = 1; i < 100; i++) {
        mt.insert(BigInt(i))
      }
    })

    test("Generate Merkle Proof of existing commitment", () => {
      expect(mt.root).not.toEqual(0n)
      expect(mt.size).toEqual(99)

      const proof = FnPrivacyPool.merkleProofFn({
        mt: mt,
        maxDepth: 32
      })(55n)
      expect(proof.Root).toEqual(mt.root)
      expect(proof.Depth).toEqual(7n)
      expect(proof.LeafIndex).toEqual(55n)
      expect(proof.Siblings.length).toEqual(32)
    })

    test("Generating merkle-proof of non-existing commitment should throw", () => {
      expect(() => {
        FnPrivacyPool.merkleProofFn({
          mt: mt,
          maxDepth: 32
        })(120n)
      }).toThrow()
    })
  })
  describe("Test CalcPublicValFn", () => {
    let pK: PrivacyKey
    beforeEach(() => {
      pK = CreatePrivacyKey()
    })

    test("Two dummy Inputs, 1 dummy Ouptut and 1 non-dummy Ouptut of size 100n", () => {
      const out = FnPrivacyPool.calcPublicValFn({
        inputs: genTestCommitments([
          { value: 0n, pK: pK },
          { value: 0n, pK: pK }
        ]),
        outputs: genTestCommitments([
          { value: 0n, pK: pK },
          { value: 100n, pK: pK }
        ])
      })
      expect(out().isCommit).toEqual(true)
      expect(out().publicVal).toEqual(100n)
    })
  })

  describe("Test GetInputsFn", () => {
    let mt: LeanIMT
    let pK: PrivacyKey

    const test_non_zero_values = [50n, 100n, 150n, 200n, 250n, 300n]
    let commitments: Commitment[]
    beforeEach(() => {
      mt = new LeanIMT(hashLeftRight)
      pK = CreatePrivacyKey()

      // generate commitments for non zero values
      // and insert into merkle tree
      commitments = test_non_zero_values.map((value) => {
        const commitment = genTestCommitment(value, pK)
        mt.insert(commitment.hash())
        commitment.index = BigInt(mt.size - 1)
        return commitment
      })
    })

    test("Input: (0, 50), Ouptut: (0, 100), PublicVal: 50", () => {
      const expected_public_val = 50n
      const non_zero_output = genTestCommitment(100n, pK)
      const io = FnPrivacyPool.getInputsFn({
        mt: mt,
        maxDepth: 32,
        inputs: [getTestDummyCommimtment(pK), commitments[0]],
        outputs: [getTestDummyCommimtment(pK), non_zero_output],
        scope: 100n
      })()

      expect(io.inputs.publicVal).toEqual(expected_public_val)
      expect(io.inputs.scope).toEqual(100n)
      expect(io.inputs.inputValue).toEqual([0n, 50n])
      expect(io.inputs.inputPublicKey[1]).toEqual(pK.pubKey.asCircuitInputs())
      expect(io.inputs.inputNullifier[1]).toEqual(commitments[0].nullifier)
      expect(io.inputs.outputValue).toEqual([0n, 100n])
      expect(io.inputs.outputCommitment[1]).toEqual(non_zero_output.hash())
      expect(io.inputs.actualMerkleTreeDepth).toEqual(3n)
      expect(io.inputs.inputLeafIndex).toEqual([0n, 0n])
    })
  })

  describe("Testing proof generation", () => {
    let mt: LeanIMT
    let pK: PrivacyKey

    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
    const prover = FnPrivacyPool.ProveFn(paths.WASM_PATH, paths.ZKEY_PATH)

    const test_non_zero_values = [50n, 100n, 150n, 200n, 250n, 300n]
    let commitments: Commitment[]

    beforeEach(async () => {
      mt = new LeanIMT(hashLeftRight)
      pK = CreatePrivacyKey()

      // generate commitments for non zero values
      // and insert into merkle tree
      commitments = test_non_zero_values.map((value) => {
        const commitment = genTestCommitment(value, pK)
        mt.insert(commitment.hash())
        commitment.index = BigInt(mt.size - 1)
        return commitment
      })
    }, 100000)

    afterEach(async () => {
      await cleanThreads()
    })

    test("Input: (0, 50), Ouptut: (0, 100), PublicVal: 50", async () => {
      const verifier = FnPrivacyPool.VerifyFn(
        fs.readFileSync(paths.VKEY_PATH, "utf-8")
      )

      const non_zero_output = genTestCommitment(100n, pK)
      const io = FnPrivacyPool.getInputsFn({
        mt: mt,
        maxDepth: 32,
        inputs: [commitments[0], getTestDummyCommimtment(pK)],
        outputs: [getTestDummyCommimtment(pK), non_zero_output],
        scope: 100n
      })()

      const out = await prover(io.inputs)
      const ok = await verifier(out)

      expect(ok).toEqual(true)

      const parsed_proof = FnPrivacyPool.parseOutputFn()(out) as CircomOutputT
      expect(parsed_proof.publicSignals[0]).toEqual(mt.root)
    }, 100000) // timeout as downloading the wasm and zkey files can take time
  })
})
