// run test with:
// bunx jest ./tests/c.privacypool.test.ts
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { NewCommitment } from "@privacy-pool-v1/domainobjs"
import { beforeAll, describe, expect, test } from "@jest/globals"
import type { OnChainPrivacyPool } from "@privacy-pool-v1/contracts"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import {
  ExistingPrivacyPools,
  GetOnChainPrivacyPool
} from "@privacy-pool-v1/contracts"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import fs from "node:fs"
import type { Hex } from "viem"
import {
  createPublicClient,
  createWalletClient,
  http,
  publicActions
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { gnosis } from "viem/chains"

const rpc = ""
const privateKey: Hex = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
import type { Commitment } from "@privacy-pool-v1/domainobjs"

const pkScalar = deriveSecretScalar(privateKey)
const account = privateKeyToAccount(privateKey)
const publicAddress = account.address
const walletClient = createWalletClient({
  account,
  chain: gnosis,
  transport: http(rpc)
}).extend(publicActions)

const SECONDS = 1000
jest.setTimeout(70 * SECONDS)

describe("Testing Contract Bindings", () => {
  let privacyPool: OnChainPrivacyPool
  const poolInstance = ExistingPrivacyPools.get(gnosis)

  beforeAll(() => {
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    privacyPool = GetOnChainPrivacyPool(
      poolInstance[0],
      createPublicClient({
        chain: gnosis,
        transport: http(rpc)
      }),
      {
        vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
        wasm: paths.WASM_PATH,
        zKey: paths.ZKEY_PATH
      }
    )
  })

  afterEach(async () => {
    await cleanThreads()
  })

  test("scope should return Contract's Scope", async () => {
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    const scopeVal = await privacyPool.scope()
    expect(scopeVal).toBe(poolInstance[0].scope)
  })

  test("context() should work", async () => {
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    const ctx = await privacyPool
      .context({
        src: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        sink: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        feeCollector: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        fee: 1000000000000000000n
      })
      .catch((err) => {
        console.log("Error: ", err)
      })
    expect(ctx).toBe(
      948484904148338273465419442055080943932135690228945843182471082443050349992n
    )
  })

  test("process() should work", async () => {
    const balance = await walletClient.getBalance({ address: publicAddress })
    console.log("Balance: ", balance)
    const defaultCommitVal = 1000000000000000n
    const scopeVal = await privacyPool.scope()

    const commits: Commitment[] = [
      0n,
      0n,
      defaultCommitVal < balance ? defaultCommitVal : balance,
      0n
    ].map((value, _) => {
      const c = NewCommitment({
        _pK: privateKey,
        _nonce: 0n,
        _scope: scopeVal,
        _value: value
      })
      return c
    })

    await privacyPool
      .process(
        walletClient,
        {
          src: publicAddress,
          sink: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          feeCollector: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          fee: 0n
        },
        [pkScalar, pkScalar, pkScalar, pkScalar],
        [0n, 0n, 0n, 0n],
        commits.slice(0, 2),
        commits.slice(2, 4),
        false
      )
      .then((res) => {
        expect(res).toBe(true)
      })
      .catch((err) => console.log(err))
  })
})
