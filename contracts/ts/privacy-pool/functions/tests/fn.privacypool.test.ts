// run test with:
// bunx jest ./tests/fn.privacypool.test.ts

import fs from "node:fs"
import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import {
  ScopeFn,
  ContextFn,
  ProcessFn,
  GetStateSizeFn,
  FetchRootsFn,
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

// TODO: These tests are interacting with actual testnet contracts
// Good if we can simulate a local network for testing intead
describe("Testing PrivacyPool Contract Interactions", () => {
  const poolInstance = ExistingPrivacyPools.get(sepolia)
  const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
  const privacyPool = NewPrivacyPoolCircuit({
    vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
    wasm: paths.WASM_PATH,
    zKey: paths.ZKEY_PATH
  })
  const scope = ScopeFn(sepolia)
  const context = ContextFn(sepolia)
  const stateSize = GetStateSizeFn(sepolia)
  const roots = FetchRootsFn(sepolia)

  test("ScopeFn should return Contract's Scope", async () => {
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    const scopeVal = await scope(poolInstance[0].address)
    expect(scopeVal).toBe(poolInstance[0].scope)
  })

  test("Calling Context() should work", async () => {
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    const ctx = await context(poolInstance[0].address, {
      src: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      sink: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      feeCollector: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      fee: 1000000000000000000n
    }).catch((err) => {
      console.log("Error: ", err)
    })
    expect(ctx).toBe(
      18824919204445295815315038918036918273633356007290005683148704932478272514740n
    )
  })

  test("Calling GetStateSize() & FetchRoots()  should work", async () => {
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    const _stateSize = await stateSize(poolInstance[0].address)
    console.log("State Size: ", _stateSize)
    expect(_stateSize).toBeDefined()

    const _roots = await roots(poolInstance[0].address, [0n, _stateSize - 1n])
    console.log("Roots: ", _roots)
    expect(_roots).toBeDefined()
  })
})
