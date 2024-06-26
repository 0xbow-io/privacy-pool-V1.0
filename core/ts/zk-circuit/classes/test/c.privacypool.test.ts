import fs from "node:fs"
import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"

import {
  PrivacyPool,
  genTestCircuitInputsFn
} from "@privacy-pool-v1/zero-knowledge"

import type {
  ICircuit,
  TPrivacyPool,
  Groth16_VKeyJSONT
} from "@privacy-pool-v1/core-ts/zk-circuit"

import {
  NewPrivacyPoolCircuit,
  FnPrivacyPool
} from "@privacy-pool-v1/core-ts/zk-circuit"

describe("Testing CPrivacyPool", () => {
  const testData = genTestCircuitInputsFn(10)

  describe("should pass with file paths", () => {
    let verifierKey: Groth16_VKeyJSONT
    let wasm: Uint8Array | string
    let zkey: Uint8Array | string
    let privacyPool: ICircuit.CircuitI

    beforeAll(async () => {
      // File Paths
      const paths: circomArtifactPaths = PrivacyPool.circomArtifacts
      verifierKey = await FnPrivacyPool.LoadVkeyFn(
        fs.readFileSync(paths.VKEY_PATH, "utf-8")
      )

      expect(verifierKey).toBeDefined()
      wasm = await FnPrivacyPool.LoadBinFn(paths.WASM_PATH)

      expect(wasm).toBeDefined()
      zkey = await FnPrivacyPool.LoadBinFn(paths.ZKEY_PATH)
      expect(zkey).toBeDefined()

      privacyPool = NewPrivacyPoolCircuit(wasm, zkey, verifierKey)
    })

    afterEach(async () => {
      await cleanThreads()
    })

    test.each(testData)(
      "should compute verifiable output for %s",
      async (test) => {
        const output = (await privacyPool.prove(
          test.io.inputs
        )) as TPrivacyPool.OutputT
        expect(output).toBeDefined()
        console.log("computed output")
        const ok = await privacyPool.verify(output)
        expect(ok).toEqual(true)
        // expect(output.publicSignals[0]).toEqual(test.io.ouptuts[0])
      }
    )
  })
})
