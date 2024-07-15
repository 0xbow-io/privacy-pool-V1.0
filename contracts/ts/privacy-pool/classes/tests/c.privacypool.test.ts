// run test with:
// bunx jest ./test/c.privacypool.test.ts
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
  publicActions,
  parseEther
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import type { Commitment } from "@privacy-pool-v1/domainobjs"

const rpc = ""
const privateKey: Hex = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

const pkScalar = deriveSecretScalar(privateKey)
const account = privateKeyToAccount(privateKey)
const publicAddress = account.address
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(rpc)
}).extend(publicActions)

const SECONDS = 1000
jest.setTimeout(70 * SECONDS)

describe("Testing Contract Bindings", () => {
  let privacyPool: OnChainPrivacyPool
  const poolInstance = ExistingPrivacyPools.get(sepolia)

  beforeAll(() => {
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    privacyPool = GetOnChainPrivacyPool(
      poolInstance[0],
      createPublicClient({
        chain: sepolia,
        transport: rpc !== "" ? http(rpc) : http()
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

  test("process() should work", async () => {
    const balance = await walletClient.getBalance({ address: publicAddress })
    const defaultCommitVal = parseEther("0.0003")
    const scopeVal = await privacyPool.scope()

    console.log("Balance: ", balance, " commiting: ", defaultCommitVal)

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
          sink: publicAddress,
          feeCollector: publicAddress,
          fee: 0n
        },
        [pkScalar, pkScalar, pkScalar, pkScalar],
        [0n, 0n, 0n, 0n],
        commits.slice(0, 2),
        commits.slice(2, 4),
        false
      )
      .then((res) => {
        console.log("got txHash: ", res)
        expect(res).toBeDefined()
      })
      .catch((err) => console.log(err))
  })
})
