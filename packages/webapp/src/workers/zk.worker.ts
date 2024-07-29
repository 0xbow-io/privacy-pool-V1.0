import { type circomArtifactPaths } from "@privacy-pool-v1/global/configs/type"
import {
  createPublicClient,
  createWalletClient,
  type Hex,
  http,
  parseEther,
  publicActions
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
  createNewCommitment,
  PrivacyKey,
  RecoverCommitment
} from "@privacy-pool-v1/domainobjs/ts"
import {
  ExistingPrivacyPools,
  getOnChainPrivacyPool,
  type OnChainPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { gnosis } from "viem/chains"
import { DEFAULT_RPC_URL, DEFAULT_TARGET_CHAIN } from "@/utils/consts.ts"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge/ts/circuit.ts"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"

let privacyPool: OnChainPrivacyPool
const poolInstance = ExistingPrivacyPools.get(gnosis)
if (poolInstance === undefined) {
  throw new Error("Pool Instance is undefined")
}
privacyPool = getOnChainPrivacyPool(
  poolInstance[0],
  createPublicClient({
    chain: DEFAULT_TARGET_CHAIN,
    transport: DEFAULT_RPC_URL !== "" ? http(DEFAULT_RPC_URL) : http()
  })
)

const basePath = "/artefacts"
const paths: circomArtifactPaths = {
  VKEY_PATH: `${basePath}/groth16_vkey.json`,
  WASM_PATH: `${basePath}/PrivacyPool_V1.wasm`,
  ZKEY_PATH: `${basePath}/groth16_pkey.zkey`
}

const makeNewCommit = async (privateKey: Hex) => {
  const account = privateKeyToAccount(privateKey)
  const publicAddress = account.address
  const walletClient = createWalletClient({
    account,
    chain: DEFAULT_TARGET_CHAIN,
    transport: DEFAULT_RPC_URL !== "" ? http(DEFAULT_RPC_URL) : http()
  }).extend(publicActions)

  const privacyKey = PrivacyKey.from(privateKey, 0n)

  const balance = await walletClient.getBalance({ address: publicAddress })
  const defaultCommitVal = parseEther("0.0001")
  const scopeVal = await privacyPool.scope()

  const synced = await privacyPool.sync()

  if (!synced) {
    throw new Error("sync failed")
  }

  await privacyPool.decryptCiphers([privacyKey])
  const commits = await privacyKey.recoverCommitments(privacyPool)

  const vKey = await fetch(paths.VKEY_PATH).then((res) => res.text())
  const wasm = await fetch(paths.WASM_PATH).then((res) => res.arrayBuffer())
  const zKey = await fetch(paths.ZKEY_PATH).then((res) => res.arrayBuffer())

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
      [privacyKey.nonce, privacyKey.nonce, privacyKey.nonce, privacyKey.nonce],
      [
        createNewCommitment({
          _pK: privateKey,
          _nonce: 0n,
          _scope: scopeVal,
          _value: 0n
        }),
        commits[0]
      ],
      [
        createNewCommitment({
          _pK: privateKey,
          _nonce: 0n,
          _scope: scopeVal,
          _value: defaultCommitVal
        }),
        createNewCommitment({
          _pK: privateKey,
          _nonce: 0n,
          _scope: scopeVal,
          _value: commits[0].asTuple()[0] + defaultCommitVal
        })
      ],
      {
        vKey: vKey,
        wasm: new Uint8Array(wasm),
        zKey: new Uint8Array(zKey)
      },
      false
    )
    .then((res) => {
      return res
    })
    .catch((err) => console.log(err))
}

const release = async (privacyKey: PrivacyKey, outputValues: bigint[]) => {
  const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)

  const pkScalar = privacyKey.pKScalar
  const privateKey = privacyKey.asJSON.privateKey
  const account = privateKeyToAccount(privateKey)

  const publicAddress = account.address
  const walletClient = createWalletClient({
    account,
    chain: DEFAULT_TARGET_CHAIN,
    transport: DEFAULT_RPC_URL !== "" ? http(DEFAULT_RPC_URL) : http()
  }).extend(publicActions)

  const vKey = await fetch(paths.VKEY_PATH).then((res) => res.text())
  const wasm = await fetch(paths.WASM_PATH).then((res) => res.arrayBuffer())
  const zKey = await fetch(paths.ZKEY_PATH).then((res) => res.arrayBuffer())
  const scopeVal = await privacyPool.scope()
  const recoveredCommitments = await privacyKey.recoverCommitments(privacyPool)

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
        createNewCommitment({
          _pK: privateKey,
          _nonce: 0n,
          _scope: scopeVal,
          _value: 0n
        }),
        recoveredCommitments[0]
      ],
      [
        createNewCommitment({
          _pK: privateKey,
          _nonce: 0n,
          _scope: scopeVal,
          _value: outputValues[0]
        }),
        createNewCommitment({
          _pK: privateKey,
          _nonce: 0n,
          _scope: scopeVal,
          _value: outputValues[1]
        })
      ],
      {
        vKey: vKey,
        wasm: new Uint8Array(wasm),
        zKey: new Uint8Array(zKey)
      },
      false
    )
    .then((res) => {
      console.log("got txHash: ", res)
      return res
    })
    .catch((err) => console.log(err))
}

self.addEventListener("message", async (event) => {
  // Check if the message is to trigger the performComputation function
  if (event.data.action === "makeCommit") {
    try {
      const result = await makeNewCommit(event.data.privateKey)
      // Send the result back to the main thread
      self.postMessage({ action: "makeCommitRes", payload: result })
    } catch (error) {
      console.error("Error in worker", error)
      // Send the error back to the main thread
      self.postMessage({ action: "makeCommitErr", payload: error })
    }
  }

  if (event.data.action === "releaseCommit") {
    try {
      const result = await release(
        event.data.privacyKey,
        event.data.outputValues
      )
      // Send the result back to the main thread
      self.postMessage({ action: "releaseRes", payload: result })
    } catch (error) {
      console.error("Error in worker", error)
      // Send the error back to the main thread
      self.postMessage({ action: "releaseErr", payload: error })
    }
  }
})
