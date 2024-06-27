import fs from "node:fs"
import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"
import { genTestData } from "@privacy-pool-v1/core-ts/zk-circuit"
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"

import {
  PrivacyPool,
  genTestCircuitInputsFn
} from "@privacy-pool-v1/zero-knowledge"

import type {
  ICircuit,
  TPrivacyPool,
  Groth16_VKeyJSONT,
  CircomArtifactT,
  CircomOutputT
} from "@privacy-pool-v1/core-ts/zk-circuit"

import {
  NewPrivacyPoolCircuit,
  FnPrivacyPool
} from "@privacy-pool-v1/core-ts/zk-circuit"

describe("Testing CPrivacyPool", () => {
  describe("should pass with file paths", () => {
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
    const privacyPool = NewPrivacyPoolCircuit({
      vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
      wasm: paths.WASM_PATH,
      zKey: paths.ZKEY_PATH
    })

    beforeAll(async () => {})

    afterEach(async () => {
      await cleanThreads()
    })

    test.each(genTestData(10)())(
      "should compute verifiable output for %s",
      async (test) => {
        // generate proof for test data
        // since verify defaults to true, this will
        // auto verify the proof
        // we also will pass down a callback function to
        // the verifier to evaluate the output
        const ok = await privacyPool
          .prove(test)(async ({ out }) => {
            expect(out).toBeDefined()
            console.log("computed output: ", out)
            return true
          })
          .catch((e) => {
            console.error(e)
          })
        expect(ok).toEqual(true)
      }
    )
  })
})
