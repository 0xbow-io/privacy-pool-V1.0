// run test with:
// bunx jest ./tests/fn.privacypool.test.ts

import fs from "node:fs"
import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import {
  ScopeFn,
  ContextFn,
  ProcessFn,
  ExistingPrivacyPools
} from "@privacy-pool-v1/contracts"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { sepolia } from "viem/chains"

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

describe("Testing PrivacyPool Contract Interactions", () => {
  const poolInstance = ExistingPrivacyPools.get(sepolia)
  const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
  const privacyPool = NewPrivacyPoolCircuit({
    vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
    wasm: paths.WASM_PATH,
    zKey: paths.ZKEY_PATH
  })
  const scope = ScopeFn(sepolia)

  test("ScopeFn should return Contract's Scope", async () => {
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    const scopeVal = await scope(poolInstance[0].address)
    console.log("got scopeVal:", scopeVal)
    expect(scopeVal).toBe(poolInstance[0].scope)
  })
})
