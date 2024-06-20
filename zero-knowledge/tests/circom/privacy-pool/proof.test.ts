import fs from "fs"
import path from "path"

import { cleanThreads } from "@privacy-pool-v1/global"
import {PrivacyPool} from "@privacy-pool-v1/zero-knowledge";
import {FnPrivacyPool} from "@privacy-pool-v1/core-ts/zk-circuit";

import { test, describe, afterEach, expect } from "@jest/globals"


describe("Test Generating Proofs", () => {
  const verifierKey = JSON.parse(fs.readFileSync(PrivacyPool.circomArtifacts.VKEY_PATH, "utf-8"))

  const testData: Array<string> = Array.from({ length: PrivacyPool.test_data_size }, (_, i) =>
    path.resolve(PrivacyPool.circomkitConf.dirInputs, "testcase_" + i.toString() + ".json")
  )
  
  afterEach(async () => {
    await cleanThreads()
  })

  test.each(testData)("should be able to generate proof with snarkJS for %s", async (inputs) => {
    const circuitInputs = JSON.parse(fs.readFileSync(inputs, "utf-8"))

    const out =  await FnPrivacyPool.ProveFn(circuitInputs.inputs, PrivacyPool.circomArtifacts.WASM_PATH, PrivacyPool.circomArtifacts.ZKEY_PATH)

    const ok = await FnPrivacyPool.VerifyFn(
        verifierKey,
        out.publicSignals,
        out.proof
      )
    expect(ok).toEqual(true)
  })  
})
