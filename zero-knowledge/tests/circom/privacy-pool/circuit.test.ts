import fs from "fs"
import path from "path"

import { cleanThreads } from "@privacy-pool-v1/global"
import {PrivacyPool} from "@privacy-pool-v1/zero-knowledge";

import { test, describe, afterEach } from "@jest/globals"

describe("Test Circom Circuit", () => {
  const circuit = PrivacyPool.circomkit()
  const testData: Array<string> = Array.from({ length: PrivacyPool.test_data_size }, (_, i) =>
    path.resolve(PrivacyPool.circomkitConf.dirInputs, "testcase_" + i.toString() + ".json")
  )
  
  afterEach(async () => {
    await cleanThreads()
  })

  test.each(testData)("witnessTester should pass for %s", async (inputs) => {
    const witnessTester = await circuit.witnessTester()
    const circuitInputs = JSON.parse(fs.readFileSync(inputs, "utf-8"))
    await witnessTester.expectPass(circuitInputs.inputs, circuitInputs.outputs)
  })
})
