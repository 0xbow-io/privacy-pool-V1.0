import fs from "node:fs"
import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"
import { genTestData } from "@privacy-pool-v1/core-ts/zk-circuit"
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import type { Hex } from "viem"
import { FnGroth16Verifier } from "@privacy-pool-v1/core-ts/pool"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"

import type {
  ICircuit,
  TPrivacyPool,
  Groth16_VKeyJSONT,
  CircomArtifactT,
  CircomOutputT,
  PackedGroth16ProofT,
  SnarkJSOutputT
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
    const verifierAddress: Hex = "0x542a99775c5eee7f165cfd19954680ab85d586e5"
    const onChainVerifier = FnGroth16Verifier.verifyProofFn(sepolia)

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
        // the verifier to verify the output on-chain
        const res = (await privacyPool
          .prove(test)(
            //callback fn to verify output on-chain
            async ({ out }) => {
              expect(out).toBeDefined()
              const packed = FnPrivacyPool.parseOutputFn("pack")(
                out as SnarkJSOutputT
              )
              return {
                ok: await onChainVerifier(
                  verifierAddress,
                  packed as PackedGroth16ProofT<bigint>
                ),
                out: packed
              }
            }
          )
          .catch((e) => {
            console.error(e)
          })) as { ok: boolean; out: PackedGroth16ProofT<bigint> }
        expect(res.ok).toEqual(true)
        console.log("packed output: ", res.out)

        // now simulate the commit Tx
        // then execute.
      }
    )
  })
})
