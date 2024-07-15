// run test with:
// bunx jest ./tests/fn.groth16verifier.test.ts

import fs from "node:fs"
import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"
import { genTestData } from "@privacy-pool-v1/zero-knowledge"
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import type { Hex } from "viem"
import {
  FnGroth16Verifier,
  ExistingPrivacyPools
} from "@privacy-pool-v1/contracts"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"

import type {
  ICircuit,
  TPrivacyPool,
  Groth16_VKeyJSONT,
  CircomArtifactT,
  CircomOutputT,
  StdPackedGroth16ProofT,
  SnarkJSOutputT
} from "@privacy-pool-v1/zero-knowledge"

import {
  NewPrivacyPoolCircuit,
  FnPrivacyPool
} from "@privacy-pool-v1/zero-knowledge"

const SECONDS = 1000
jest.setTimeout(70 * SECONDS)

const poolInstance = ExistingPrivacyPools.get(sepolia)

describe("Testing Groth16 Verifier On-Chain Contract Interactions", () => {
  // TODO: run contract in local network
  // Currently using contract deployed in sepolia chain
  const poolInstance = ExistingPrivacyPools.get(sepolia)
  const onChainVerifier = FnGroth16Verifier.verifyProofFn(sepolia)

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

    test.each(genTestData(10n)())(
      "should compute verifiable output for %s",
      async (test) => {
        if (poolInstance === undefined) {
          throw new Error("Pool Instance is undefined")
        }
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
                verified: await onChainVerifier(
                  poolInstance[0].verifier,
                  packed as StdPackedGroth16ProofT<bigint>
                ),
                packedProof: packed
              }
            }
          )
          .catch((e) => {
            console.error(e)
          })) as {
          verified: boolean
          packedProof: StdPackedGroth16ProofT<bigint>
        }
        expect(res.verified).toEqual(true)
        console.log("packed output: ", res.packedProof)
      }
    )
  })
})
