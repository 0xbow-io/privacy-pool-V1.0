import fs from "node:fs"
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
      const expected_isCommit = true
      const expected_public_val = 100n
      const inputs: Commitment[] = genTestCommitments([
        { value: 0n, pK: pK },
        { value: 0n, pK: pK }
      ]).map((c) => c)
      const outputs: Commitment[] = genTestCommitments([
        { value: 0n, pK: pK },
        { value: 100n, pK: pK }
      ]).map((c) => c)

      const out = FnPrivacyPool.CalcPublicValFn(inputs, outputs)
      expect(out.isCommit).toEqual(expected_isCommit)
      expect(out.publicVal).toEqual(expected_public_val)
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

      const circuit_io = FnPrivacyPool.GetInputsFn(
        mt,
        32,
        inputs,
        outputs,
        100n
      )
      expect(circuit_io.inputs.publicVal).toEqual(expected_public_val)
      expect(circuit_io.inputs.scope).toEqual(100n)
      expect(circuit_io.inputs.inputValue).toEqual([0n, 50n])
      expect(circuit_io.inputs.inputPublicKey[1]).toEqual(
        pK.pubKey.asCircuitInputs()
      )
      expect(circuit_io.inputs.inputNullifier[1]).toEqual(
        commitments[0].nullifier
      )
      expect(circuit_io.inputs.outputValue).toEqual([0n, 100n])
      expect(circuit_io.inputs.outputCommitment[1]).toEqual(
        non_zero_output.hash
      )
      expect(circuit_io.inputs.actualMerkleTreeDepth).toEqual(3n)
      expect(circuit_io.inputs.inputLeafIndex).toEqual([0n, 0n])
    })
  })

  describe("Test ProveFn, VerifyFn & ParseFn (node)", () => {
    let mt: LeanIMT
    let pK: PrivacyKey

    // File Paths
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)

    const test_non_zero_values = [50n, 100n, 150n, 200n, 250n, 300n]
    let commitments: Commitment[]
    let verifierKey: Groth16_VKeyJSONT
    let wasm: Uint8Array | string
    let zkey: Uint8Array | string

    beforeEach(async () => {
      mt = new LeanIMT(hashLeftRight)
      pK = CreatePrivacyKey()

      mt = new LeanIMT(hashLeftRight)
      pK = CreatePrivacyKey()

      verifierKey = await FnPrivacyPool.LoadVkeyFn(
        fs.readFileSync(paths.VKEY_PATH, "utf-8")
      )

      wasm = await FnPrivacyPool.LoadBinFn(paths.WASM_PATH)
      expect(wasm).toBeDefined()

      zkey = await FnPrivacyPool.LoadBinFn(paths.ZKEY_PATH)
      expect(zkey).toBeDefined()

      // generate commitments for non zero values
      // and insert into merkle tree
      commitments = test_non_zero_values.map((value) => {
        const commitment = genTestCommitment(value, pK)
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

      const circuit_io = FnPrivacyPool.GetInputsFn(
        mt,
        32,
        inputs,
        outputs,
        100n
      )
      const out = await FnPrivacyPool.ProveFn(
        circuit_io.inputs,
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

    // using remote paths (URLS)
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(true)

    const test_non_zero_values = [50n, 100n, 150n, 200n, 250n, 300n]
    let commitments: Commitment[]
    let verifierKey: Groth16_VKeyJSONT | undefined = undefined
    let wasm: Uint8Array | string | undefined = undefined
    let zkey: Uint8Array | string | undefined = undefined

    beforeEach(async () => {
      mt = new LeanIMT(hashLeftRight)
      pK = CreatePrivacyKey()

      verifierKey = await FnPrivacyPool.LoadVkeyFn(paths.VKEY_PATH)
      wasm = await FnPrivacyPool.LoadBinFn(paths.WASM_PATH)
      zkey = await FnPrivacyPool.LoadBinFn(paths.ZKEY_PATH)

      // generate commitments for non zero values
      // and insert into merkle tree
      commitments = test_non_zero_values.map((value) => {
        const commitment = genTestCommitment(value, pK)
        mt.insert(commitment.hash)
        commitment.index = BigInt(mt.size - 1)
        return commitment
      })
    }, 100000)

    afterEach(async () => {
      await cleanThreads()
    })

    test("Input: (0, 50), Ouptut: (0, 100), PublicVal: 50", async () => {
      expect(verifierKey).toBeDefined()
      expect(wasm).toBeDefined()
      expect(zkey).toBeDefined()

      const non_zero_output = genTestCommitment(100n, pK)
      const inputs: Commitment[] = [commitments[0], getTestDummyCommimtment(pK)]
      const outputs: Commitment[] = [
        getTestDummyCommimtment(pK),
        non_zero_output
      ]

      const circuit_io = FnPrivacyPool.GetInputsFn(
        mt,
        32,
        inputs,
        outputs,
        100n
      )
      const out = await FnPrivacyPool.ProveFn(
        circuit_io.inputs,
        wasm ?? "",
        zkey ?? ""
      )
      let ok = false
      if (verifierKey) {
        ok = await FnPrivacyPool.VerifyFn(
          verifierKey,
          out.publicSignals,
          out.proof
        )
      }
      expect(ok).toEqual(true)

      const parsed_proof = FnPrivacyPool.ParseFn(out.proof, out.publicSignals)
      expect(parsed_proof.publicSignals[0]).toEqual(mt.root)
    }, 100000) // timeout as downloading the wasm and zkey files can take time
  })
})
