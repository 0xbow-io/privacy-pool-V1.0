import fs from "node:fs"
import path from "node:path"

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"

import { test, describe, afterEach, expect } from "@jest/globals"

describe("Test Generating Proofs", () => {
  const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)

  const verifierKey = JSON.parse(fs.readFileSync(paths.VKEY_PATH, "utf-8"))
  const prover = FnPrivacyPool.ProveFn(paths.WASM_PATH, paths.ZKEY_PATH)
  const verifier = FnPrivacyPool.VerifyFn()

  const testData: Array<string> = Array.from(
    { length: PrivacyPool.test_data_size },
    (_, i) =>
      path.resolve(PrivacyPool.circomkitConf.dirInputs, `testcase_${i}.json`)
  )

  afterEach(async () => {
    await cleanThreads()
  })

  test.each(testData)(
    "should be able to generate proof with snarkJS for %s",
    async (inputs) => {
      const circuitInputs = JSON.parse(fs.readFileSync(inputs, "utf-8"))

      const out = await prover(circuitInputs.inputs)
      console.log("outputs: ", circuitInputs, " out ", out.publicSignals)

      const ok = await verifier(verifierKey, out)
      expect(ok).toEqual(true)
    }
  )
})
