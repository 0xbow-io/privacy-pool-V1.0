// run test with:
// bunx jest ./test/c.privacypool.test.ts
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import { NewCommitment } from "@privacy-pool-v1/domainobjs"
import { beforeAll, describe, expect, test } from "@jest/globals"
import type { OnChainPrivacyPool } from "@privacy-pool-v1/contracts"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import {
  ExistingPrivacyPools,
  getOnChainPrivacyPool
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
import { sepolia, gnosis } from "viem/chains"
import type { Commitment, PrivacyKeys } from "@privacy-pool-v1/domainobjs"
import { PrivacyKey } from "@privacy-pool-v1/domainobjs"
const rpc: string = ""
const TARGET_CHAIN = gnosis

const SECONDS = 1000
jest.setTimeout(70 * SECONDS)

describe("Testing Contract Bindings", () => {
  let privacyPool: OnChainPrivacyPool
  const poolInstance = ExistingPrivacyPools.get(gnosis)

  beforeAll(() => {
    if (poolInstance === undefined) {
      throw new Error("Pool Instance is undefined")
    }
    privacyPool = getOnChainPrivacyPool(
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

  test("process() should work for making a new commit", async () => {
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)

    const privateKey: Hex = ""
    const account = privateKeyToAccount(privateKey)
    const publicAddress = account.address
    const walletClient = createWalletClient({
      account,
      chain: TARGET_CHAIN,
      transport: rpc !== "" ? http(rpc) : http()
    }).extend(publicActions)

    const privacyKey = PrivacyKey.from(privateKey, 0n)

    const balance = await walletClient.getBalance({ address: publicAddress })
    const defaultCommitVal = parseEther("0.0001")
    const scopeVal = await privacyPool.scope()

    const synced = await privacyPool.sync()
    expect(synced).toBe(true)

    await privacyPool.decryptCiphers([privacyKey])
    const commits = await privacyKey.recoverCommitments(privacyPool)

    console.log(commits)

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
          NewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: 0n
          }),
          commits[0]
        ],
        [
          NewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: defaultCommitVal
          }),
          NewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: commits[0].asTuple()[0] + defaultCommitVal
          })
        ],
        {
          vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
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

  /*
  test("process() should work for making a release", async () => {
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)

    const privateKey: Hex = ""
    const pkScalar = deriveSecretScalar(privateKey)
    const account = privateKeyToAccount(privateKey)
    const publicAddress = account.address
    const walletClient = createWalletClient({
      account,
      chain: TARGET_CHAIN,
      transport: rpc !== "" ? http(rpc) : http()
    }).extend(publicActions)

    const balance = await walletClient.getBalance({ address: publicAddress })
    const defaultCommitVal = parseEther("0.0001")
    const scopeVal = await privacyPool.scope()

    // recover commitments that are not void and haven
    // not been nullified
    const recovered = await privacyPool.recoverCommitments([
      {
        pkScalar: pkScalar,
        nonce: 0n
      }
    ])

    console.log(recovered[0].commitment.asTuple())

    // we will then use one of the recovered commitments for a release transaction
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
        [
          NewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: 0n
          }),
          recovered[0].commitment
        ],
        [
          NewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: 0n
          }),
          NewCommitment({
            _pK: privateKey,
            _nonce: 0n,
            _scope: scopeVal,
            _value: 0n
          })
        ],
        {
          vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
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
