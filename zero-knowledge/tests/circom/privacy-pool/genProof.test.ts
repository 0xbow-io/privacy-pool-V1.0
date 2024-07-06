// run test with:
// bunx jest ./tests/circom/privacy-pool/genProof.test.ts

import fs from "node:fs"

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import { GenTestCases } from "@privacy-pool-v1/core-ts/zk-circuit"

import { test, describe, afterEach, expect } from "@jest/globals"

describe("Generating Proofs With SnarkJS", () => {
  const tcs = GenTestCases()()

  const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
  const prover = FnPrivacyPool.ProveFn(paths.WASM_PATH, paths.ZKEY_PATH)
  const verifier = FnPrivacyPool.VerifyFn(
    fs.readFileSync(paths.VKEY_PATH, "utf-8")
  )

  afterEach(async () => {
    await cleanThreads()
  })

  test(
    tcs[0][0].case,
    async () => {
      const i = 0
      for (const tvariant of tcs) {
        console.log("Test case: ", tvariant[i])
        const out = await prover(tvariant[i].inputs)

        console.log(
          "outputs: ",
          tvariant[i].expectedOutputs,
          " out ",
          out.publicSignals
        )

        const ok = await verifier(out)
        expect(ok).toEqual(true)
      }
    },
    1000000
  )
  test(
    tcs[0][1].case,
    async () => {
      const i = 1
      for (const tvariant of tcs) {
        console.log("Test case: ", tvariant[i])
        const out = await prover(tvariant[i].inputs)

        console.log(
          "outputs: ",
          tvariant[i].expectedOutputs,
          " out ",
          out.publicSignals
        )

        const ok = await verifier(out)
        expect(ok).toEqual(true)
      }
    },
    1000000
  )
  test(
    tcs[0][2].case,
    async () => {
      const i = 2
      for (const tvariant of tcs) {
        console.log("Test case: ", tvariant[i])
        const out = await prover(tvariant[i].inputs)

        console.log(
          "outputs: ",
          tvariant[i].expectedOutputs,
          " out ",
          out.publicSignals
        )

        const ok = await verifier(out)
        expect(ok).toEqual(true)
      }
    },
    1000000
  )
  test(
    tcs[0][3].case,
    async () => {
      const i = 3
      for (const tvariant of tcs) {
        console.log("Test case: ", tvariant[i])
        const out = await prover(tvariant[i].inputs)

        console.log(
          "outputs: ",
          tvariant[i].expectedOutputs,
          " out ",
          out.publicSignals
        )

        const ok = await verifier(out)
        expect(ok).toEqual(true)
      }
    },
    1000000
  )
  test(
    tcs[0][4].case,
    async () => {
      const i = 4
      for (const tvariant of tcs) {
        console.log("Test case: ", tvariant[i])
        const out = await prover(tvariant[i].inputs)

        console.log(
          "outputs: ",
          tvariant[i].expectedOutputs,
          " out ",
          out.publicSignals
        )

        const ok = await verifier(out)
        expect(ok).toEqual(true)
      }
    },
    1000000
  )
  test(
    tcs[0][5].case,
    async () => {
      const i = 5
      for (const tvariant of tcs) {
        console.log("Test case: ", tvariant[i])
        const out = await prover(tvariant[i].inputs)

        console.log(
          "outputs: ",
          tvariant[i].expectedOutputs,
          " out ",
          out.publicSignals
        )

        const ok = await verifier(out)
        expect(ok).toEqual(true)
      }
    },
    1000000
  )
})
