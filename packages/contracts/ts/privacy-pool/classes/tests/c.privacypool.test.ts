// run test with:
// bunx jest ./test/c.privacypool.test.ts
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import {
  CreateNewCommitment,
  RecoverFromJSON
} from "@privacy-pool-v1/domainobjs"
import { beforeAll, describe, expect, test } from "@jest/globals"
import type { OnChainPrivacyPool } from "@privacy-pool-v1/contracts"
import {
  ExistingPrivacyPools,
  GetOnChainPrivacyPool
} from "@privacy-pool-v1/contracts"
import type { Hex } from "viem"
import {
  createPublicClient,
  createWalletClient,
  http,
  publicActions,
  parseEther
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia, gnosis } from "viem/chains"
import { PrivacyKey } from "@privacy-pool-v1/domainobjs"
const rpc: string = ""
const TARGET_CHAIN = sepolia

const paths = {
  WASM_PATH:
    "https://raw.githubusercontent.com/0xbow-io/privacy-pool-V1.0/final_core_revision/global/artifacts/circom/privacy-pool/PrivacyPool_V1/PrivacyPool_V1_js/PrivacyPool_V1.wasm",
  VKEY_PATH:
    "https://raw.githubusercontent.com/0xbow-io/privacy-pool-V1.0/final_core_revision/global/artifacts/circom/privacy-pool/PrivacyPool_V1/groth16_vkey.json",
  ZKEY_PATH:
    "https://raw.githubusercontent.com/0xbow-io/privacy-pool-V1.0/final_core_revision/global/artifacts/circom/privacy-pool/PrivacyPool_V1/groth16_pkey.zkey"
}

const privateKey: Hex = ""
const account = privateKeyToAccount(privateKey)
const privacyKey = PrivacyKey.from(privateKey, 0n)

const defaultCommitVal = parseEther("0.00001")

const SECONDS = 1000
jest.setTimeout(70 * SECONDS)

describe("Testing Contract Bindings", () => {
  let privacyPool: OnChainPrivacyPool
  const poolInstance = ExistingPrivacyPools.get(TARGET_CHAIN)

  beforeAll(() => {
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    privacyPool = GetOnChainPrivacyPool(
      poolInstance[0],
      createPublicClient({
        chain: TARGET_CHAIN,
        transport: rpc !== "" ? http(rpc) : http()
      })
    )
  })

  afterEach(async () => {
    await cleanThreads()
  })

  test("sync() should correctly sync to onchain state", async () => {
    const res = await privacyPool.sync()
    expect(res).toBe(true)
  })

  test("commitment recovery", async () => {
    const publicAddress = account.address
    console.log("public address", publicAddress)

    const walletClient = createWalletClient({
      account,
      chain: TARGET_CHAIN,
      transport: rpc !== "" ? http(rpc) : http()
    }).extend(publicActions)

    const balance = await walletClient.getBalance({ address: publicAddress })
    const scopeVal = await privacyPool.scope()
    const synced = await privacyPool.sync()
    const stateSize = privacyPool.StateSize()

    expect(synced).toBe(true)

    await privacyPool.decryptCiphers([privacyKey])
    const commits = await privacyKey.recoverCommitments(privacyPool, false)

    console.log("stateSize", stateSize)
    console.log("stateRoot", privacyPool.StateRoot())
    console.log(
      "existing commits",
      commits.map((c) => c.root())
    )

    const commitJSONDocs = commits.map((c) => c.toJSON())
    // attempt to recover commitments from JSON
    const recoveredCommits = commitJSONDocs.map((c) =>
      RecoverFromJSON(c, privacyKey.pKScalar, privacyKey.nonce)
    )
    console.log(
      "recovered commits",
      recoveredCommits.map((c) => c.root())
    )
  })

  /*
  test("process() should work for making a new commit ", async () => {
    const publicAddress = account.address
    console.log("public address", publicAddress)
    const walletClient = createWalletClient({
      account,
      chain: TARGET_CHAIN,
      transport: rpc !== "" ? http(rpc) : http()
    }).extend(publicActions)

    const balance = await walletClient.getBalance({ address: publicAddress })
    const scopeVal = await privacyPool.scope()
    const synced = await privacyPool.sync()
    const stateSize = privacyPool.StateSize()

    expect(synced).toBe(true)

    await privacyPool.decryptCiphers([privacyKey])
    const commits = await privacyKey.recoverCommitments(privacyPool, false)

    console.log("stateSize", stateSize)
    console.log("stateRoot", privacyPool.StateRoot())
    console.log(
      "existing commits",
      commits.map((c) => c.root())
    )

    // we will then use one of the recovered commitments for a commit transaction
    await privacyPool
      .process(
        walletClient,
        {
          src: publicAddress,
          sink: publicAddress,
          feeCollector: publicAddress,
          fee: 0n
        },
        [
          privacyKey.pKScalar,
          privacyKey.pKScalar,
          privacyKey.pKScalar,
          privacyKey.pKScalar
        ],
        [
          privacyKey.nonce,
          privacyKey.nonce,
          privacyKey.nonce,
          privacyKey.nonce
        ],
        [
          CreateNewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: 0n
          }),
          CreateNewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: 0n
          })
        ],
        [
          CreateNewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: parseEther("0.0005")
          }),
          CreateNewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: parseEther("0.0005")
          })
        ],
        {
          vKey: paths.VKEY_PATH,
          wasm: paths.WASM_PATH,
          zKey: paths.ZKEY_PATH
        },
        false
      )
      .then((res) => {
        console.log("got txHash: ", res)
        expect(res).toBeDefined()
      })
      .catch((err) => console.log(err))
  })
   */
})
