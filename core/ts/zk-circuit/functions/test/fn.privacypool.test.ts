import type { Commitment, PrivacyKey } from "@privacy-pool-v1/core-ts/account"
import {
  CreateCommitment,
  CreatePrivacyKey
} from "@privacy-pool-v1/core-ts/account"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import type { Groth16_VKeyJSONT } from "@privacy-pool-v1/core-ts/zk-circuit"

import { expect, test, describe, beforeEach, afterEach } from "@jest/globals"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import { cleanThreads } from "@privacy-pool-v1/global"

function getTestDummyCommimtment(pK: PrivacyKey): Commitment {
  return CreateCommitment(pK, { amount: 0n })
}
function genTestCommitment(amount: bigint, pK: PrivacyKey): Commitment {
  return CreateCommitment(pK, { amount: amount })
}
function genTestCommitments(
  specs: { amount: bigint; pK: PrivacyKey }[]
): Commitment[] {
  return specs.map((spec) => genTestCommitment(spec.amount, spec.pK))
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

      const proof = FnPrivacyPool.MerkleProofFn(55n, mt, 32)
      expect(proof.Root).toEqual(mt.root)
      expect(proof.Depth).toEqual(7n)
      expect(proof.LeafIndex).toEqual(55n)
      expect(proof.Siblings.length).toEqual(32)
    })

    test("Generating merkle-proof of non-existing commitment should throw", () => {
      expect(() => {
        FnPrivacyPool.MerkleProofFn(120n, mt, 32)
      }).toThrow()
    })
  })
  describe("Test CalcPublicValFn", () => {
    let pK: PrivacyKey
    beforeEach(() => {
      pK = CreatePrivacyKey()
    })

    test("Two dummy Inputs, 1 dummy Ouptut and 1 non-dummy Ouptut of size 100n", () => {
      const expected_public_val = 100n
      const inputs: Commitment[] = genTestCommitments([
        { amount: 0n, pK: pK },
        { amount: 0n, pK: pK }
      ]).map((c) => c)
      const outputs: Commitment[] = genTestCommitments([
        { amount: 0n, pK: pK },
        { amount: 100n, pK: pK }
      ]).map((c) => c)

      const public_val = FnPrivacyPool.CalcPublicValFn(inputs, outputs)
      expect(public_val).toEqual(expected_public_val)
    })
  })

  describe("Test GetInputsFn", () => {
    let mt: LeanIMT
    let pK: PrivacyKey

    const test_non_zero_amounts = [50n, 100n, 150n, 200n, 250n, 300n]
    let commitments: Commitment[]
    beforeEach(() => {
      mt = new LeanIMT(hashLeftRight)
      pK = CreatePrivacyKey()

      // generate commitments for non zero amounts
      // and insert into merkle tree
      commitments = test_non_zero_amounts.map((amount) => {
        const commitment = genTestCommitment(amount, pK)
        mt.insert(commitment.hash)
        commitment.index = BigInt(mt.size - 1)
        return commitment
      })
    })

    test("Input: (0, 50), Ouptut: (0, 100), PublicVal: 50", () => {
      const expected_public_val = 50n
      const non_zero_output = genTestCommitment(100n, pK)
      const inputs: Commitment[] = [getTestDummyCommimtment(pK), commitments[0]]
      const outputs: Commitment[] = [
        getTestDummyCommimtment(pK),
        non_zero_output
      ]

      const circuit_inputs = FnPrivacyPool.GetInputsFn(
        mt,
        32,
        inputs,
        outputs,
        100n
      )
      expect(circuit_inputs.publicVal).toEqual(expected_public_val)
      expect(circuit_inputs.signalHash).toEqual(100n)
      expect(circuit_inputs.inUnits).toEqual([0n, 50n])
      expect(circuit_inputs.inPk[1]).toEqual(pK.pubKey.asCircuitInputs())
      expect(circuit_inputs.inputNullifier[1]).toEqual(commitments[0].nullifier)
      expect(circuit_inputs.outUnits).toEqual([0n, 100n])
      expect(circuit_inputs.outCommitment[1]).toEqual(non_zero_output.hash)
      expect(circuit_inputs.actualMerkleTreeDepth).toEqual(3n)
      expect(circuit_inputs.inLeafIndices).toEqual([0n, 0n])
    })
  })

  describe("Test ProveFn, VerifyFn & ParseFn (node)", () => {
    let mt: LeanIMT
    let pK: PrivacyKey

    // File Paths
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts

    const test_non_zero_amounts = [50n, 100n, 150n, 200n, 250n, 300n]
    let commitments: Commitment[]
    let verifierKey: Groth16_VKeyJSONT
    let wasm: Uint8Array | string
    let zkey: Uint8Array | string

    beforeEach(async () => {
      mt = new LeanIMT(hashLeftRight)
      pK = CreatePrivacyKey()

      mt = new LeanIMT(hashLeftRight)
      pK = CreatePrivacyKey()

      verifierKey = await FnPrivacyPool.LoadVkeyFn(paths.VKEY_PATH)
      expect(verifierKey).toBeDefined()

      wasm = await FnPrivacyPool.loadBytesFn(paths.WASM_PATH)
      expect(wasm).toBeDefined()

      zkey = await FnPrivacyPool.loadBytesFn(paths.ZKEY_PATH)
      expect(zkey).toBeDefined()

      // generate commitments for non zero amounts
      // and insert into merkle tree
      commitments = test_non_zero_amounts.map((amount) => {
        const commitment = genTestCommitment(amount, pK)
        mt.insert(commitment.hash)
        commitment.index = BigInt(mt.size - 1)
        return commitment
      })
    })

    afterEach(async () => {
      await cleanThreads()
    })

    test("Input: (0, 50), Ouptut: (0, 100), PublicVal: 50", async () => {
      const non_zero_output = genTestCommitment(100n, pK)
      const inputs: Commitment[] = [commitments[0], getTestDummyCommimtment(pK)]
      const outputs: Commitment[] = [
        getTestDummyCommimtment(pK),
        non_zero_output
      ]

      const circuit_inputs = FnPrivacyPool.GetInputsFn(
        mt,
        32,
        inputs,
        outputs,
        100n
      )
      const out = await FnPrivacyPool.ProveFn(
        circuit_inputs,
        paths.WASM_PATH,
        paths.ZKEY_PATH
      )
      const ok = await FnPrivacyPool.VerifyFn(
        verifierKey,
        out.publicSignals,
        out.proof
      )
      expect(ok).toEqual(true)

      const parsed_proof = FnPrivacyPool.ParseFn(out.proof, out.publicSignals)
      expect(parsed_proof.publicSignals[0]).toEqual(mt.root)
    })
  })

  describe("Test ProveFn, VerifyFn & ParseFn (web)", () => {
    let mt: LeanIMT
    let pK: PrivacyKey

    // usiong remote paths (URLS)
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts_remnote

    const test_non_zero_amounts = [50n, 100n, 150n, 200n, 250n, 300n]
    let commitments: Commitment[]
    let verifierKey: Groth16_VKeyJSONT
    let wasm: Uint8Array | string
    let zkey: Uint8Array | string

    beforeEach(async () => {
      mt = new LeanIMT(hashLeftRight)
      pK = CreatePrivacyKey()

      verifierKey = await FnPrivacyPool.LoadVkeyFn(paths.VKEY_PATH)
      expect(verifierKey).toBeDefined()

      wasm = await FnPrivacyPool.loadBytesFn(paths.WASM_PATH)
      expect(wasm).toBeDefined()

      zkey = await FnPrivacyPool.loadBytesFn(paths.ZKEY_PATH)
      expect(zkey).toBeDefined()

      // generate commitments for non zero amounts
      // and insert into merkle tree
      commitments = test_non_zero_amounts.map((amount) => {
        const commitment = genTestCommitment(amount, pK)
        mt.insert(commitment.hash)
        commitment.index = BigInt(mt.size - 1)
        return commitment
      })
    })

    afterEach(async () => {
      await cleanThreads()
    })

    test("Input: (0, 50), Ouptut: (0, 100), PublicVal: 50", async () => {
      const non_zero_output = genTestCommitment(100n, pK)
      const inputs: Commitment[] = [commitments[0], getTestDummyCommimtment(pK)]
      const outputs: Commitment[] = [
        getTestDummyCommimtment(pK),
        non_zero_output
      ]

      const circuit_inputs = FnPrivacyPool.GetInputsFn(
        mt,
        32,
        inputs,
        outputs,
        100n
      )
      const out = await FnPrivacyPool.ProveFn(circuit_inputs, wasm, zkey)
      const ok = await FnPrivacyPool.VerifyFn(
        verifierKey,
        out.publicSignals,
        out.proof
      )
      expect(ok).toEqual(true)

      const parsed_proof = FnPrivacyPool.ParseFn(out.proof, out.publicSignals)
      expect(parsed_proof.publicSignals[0]).toEqual(mt.root)
    }, 100000) // timeout as downloading the wasm and zkey files can take time
  })
})
