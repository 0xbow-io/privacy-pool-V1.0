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
import { createNewCommitment, PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"
import {
  ExistingPrivacyPools,
  getOnChainPrivacyPool,
  type OnChainPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { gnosis } from "viem/chains"
import { DEFAULT_RPC_URL, DEFAULT_TARGET_CHAIN } from "@/utils/consts.ts"

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

const makeNewCommit = async (privateKey: Hex) => {
  const basePath = "/artefacts";
  const paths: circomArtifactPaths = {
    VKEY_PATH: `${basePath}/groth16_vkey.json`,
    WASM_PATH: `${basePath}/PrivacyPool_V1.wasm`,
    ZKEY_PATH: `${basePath}/groth16_pkey.zkey`
  };
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
  const wasm = await fetch(paths.WASM_PATH).then((res) => res.text())
  const zKey = await fetch(paths.ZKEY_PATH).then((res) => res.text())

  console.log('existing commits', commits)

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
        vKey,
        wasm,
        zKey
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
      console.log("returned res", result)
      // Send the result back to the main thread
      self.postMessage({ action: "makeCommitRes", payload: result })
    } catch (error) {
      console.error("Error in worker", error)
      // Send the error back to the main thread
      self.postMessage({ action: "makeCommitErr", payload: error })
    }
  }
})
