import fs from "node:fs"

import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"

import {
  PrivacyPool,
  genTestCircuitInputsFn
} from "@privacy-pool-v1/zero-knowledge"

import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"

import type { IVerifier } from "@privacy-pool-v1/core-ts/pool"
import {
  GetVerifier,
  InitVerifiersCircuit
} from "@privacy-pool-v1/core-ts/pool"

describe("Testing CPrivacyPool", () => {
  const testData = genTestCircuitInputsFn(10)

  const verifier: IVerifier.VerifierI = GetVerifier(
    createPublicClient({
      chain: sepolia,
      transport: http()
    }),
    "0x542a99775c5eee7f165cfd19954680ab85d586e5"
  )

  beforeAll(async () => {
    // File Paths
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts
    const verifierKey = await FnPrivacyPool.LoadVkeyFn(
      fs.readFileSync(paths.VKEY_PATH, "utf-8")
    )
    const wasm = await FnPrivacyPool.LoadBinFn(paths.WASM_PATH)
    const zkey = await FnPrivacyPool.LoadBinFn(paths.ZKEY_PATH)

    expect(verifierKey).toBeDefined()
    expect(wasm).toBeDefined()
    expect(zkey).toBeDefined()

    InitVerifiersCircuit(wasm, zkey, verifierKey)
  })

  describe("should pass with file paths", () => {
    afterEach(async () => {
      await cleanThreads()
    })

    test.each(testData)(
      "should compute on-chain verifiable output for %s",
      async (test) => {
        const proofArgs = await verifier
          .generateProofArgs(test.io)
          .then((proofArgs) => {
            expect(proofArgs).toBeDefined()
            return proofArgs
          })
        console.log("generated proof args")
        await verifier.verifyProofARgs(proofArgs).then((result) => {
          expect(result).toBeTruthy()
        })
        console.log("successfuly verified on-chain")
      }
    )
  })
})
