import fs from "node:fs"
import path from "node:path"

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { PrivacyPool, getSignal } from "@privacy-pool-v1/zero-knowledge"

import { test, describe, afterEach } from "@jest/globals"

const circomkitInstance = PrivacyPool.circomkit()

describe("Test Circom Circuit", () => {
  const testData: Array<string> = Array.from(
    { length: PrivacyPool.test_data_size },
    (_, i) =>
      path.resolve(PrivacyPool.circomkitConf.dirInputs, `testcase_${i}.json`)
  )

  afterEach(async () => {
    await cleanThreads()
  })

  test.each(testData)("witnessTester should pass for %s", async (path) => {
    const circuitInputs = JSON.parse(fs.readFileSync(path, "utf-8"))
    const witnessTester = await circomkitInstance.witnessTester()

    const witness = await witnessTester.calculateWitness(circuitInputs.inputs)
    await witnessTester.expectConstraintPass(witness)
    const merkleRoot = await getSignal(witnessTester, witness, "merkleRoot")
    console.log("inputs: ", circuitInputs, " computed merkleRoot: ", merkleRoot)
  })
})
