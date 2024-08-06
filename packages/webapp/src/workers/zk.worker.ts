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
  CCommitment,
  type Commitment,
  createNewCommitment,
  PrivacyKey
} from "@privacy-pool-v1/domainobjs/ts"
import {
  ExistingPrivacyPools,
  getOnChainPrivacyPool,
  type OnChainPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { sepolia } from "viem/chains"
import { DEFAULT_RPC_URL, DEFAULT_TARGET_CHAIN } from "@/utils/consts.ts"
import type { ASP } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import CommitmentC = CCommitment.CommitmentC

let privacyPool: OnChainPrivacyPool
const poolInstance = ExistingPrivacyPools.get(sepolia)
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

const makeNewCommit = async (
  privateKey: Hex,
  selectedAsp: ASP,
  commitmentsHashes: Hex[],
  outputValues: number[]
) => {
  const privacyKey = PrivacyKey.from(privateKey, 0n)
  const account = privateKeyToAccount(privacyKey.asJSON.privateKey)
  const publicAddr = privacyKey.publicAddr
  const { fee, feeCollector } = selectedAsp

  const walletClient = createWalletClient({
    account,
    chain: DEFAULT_TARGET_CHAIN,
    transport: DEFAULT_RPC_URL !== "" ? http(DEFAULT_RPC_URL) : http()
  }).extend(publicActions)

  const balance = await walletClient.getBalance({ address: publicAddr })
  const defaultCommitVal = parseEther("0.0001")
  const scopeVal = await privacyPool.scope()

  const synced = await privacyPool.sync()

  if (!synced) {
    throw new Error("sync failed")
  }

  await privacyPool.decryptCiphers([privacyKey])

  const allKeyCommitments = await privacyKey.recoverCommitments(privacyPool)

  // User can pick 2 void commitments with the same hash, but the
  // commitment root will be different for them. So we need to
  // handle the case when the user picks 2 void commitments with the
  // same hash

  let selectedCommitments: [Commitment | undefined, Commitment | undefined] = [
    undefined,
    undefined
  ]

  selectedCommitments[0] = allKeyCommitments.find(
    (commit) => commit.hash().toString(16) === commitmentsHashes[0]
  )
  selectedCommitments[1] = allKeyCommitments.find(
    (commit) =>
      commit.hash().toString(16) === commitmentsHashes[1] &&
      commit.commitmentRoot !== selectedCommitments[0]?.commitmentRoot
  )

  if (!selectedCommitments[0] || !selectedCommitments[1]) {
    throw new Error("commitments not found")
  }

  const vKey = await fetch(paths.VKEY_PATH).then((res) => res.text())
  const wasm = await fetch(paths.WASM_PATH).then((res) => res.arrayBuffer())
  const zKey = await fetch(paths.ZKEY_PATH).then((res) => res.arrayBuffer())

  await privacyPool
    .process(
      walletClient,
      {
        src: publicAddr,
        sink: publicAddr,
        feeCollector,
        fee: fee
      },
      [
        privacyKey.pKScalar,
        privacyKey.pKScalar,
        privacyKey.pKScalar,
        privacyKey.pKScalar
      ],
      [privacyKey.nonce, privacyKey.nonce, privacyKey.nonce, privacyKey.nonce],
      selectedCommitments as [CommitmentC, CommitmentC],
      [
        createNewCommitment({
          _pK: privateKey,
          _nonce: 0n,
          _scope: scopeVal,
          _value: parseEther(outputValues[0].toString())
        }),
        createNewCommitment({
          _pK: privateKey,
          _nonce: 1n,
          _scope: scopeVal,
          _value: parseEther(outputValues[1].toString())
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
      const result = await makeNewCommit(
        event.data.privateKey,
        event.data.selectedASP,
        event.data.inCommits,
        event.data.outValues
      )
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
