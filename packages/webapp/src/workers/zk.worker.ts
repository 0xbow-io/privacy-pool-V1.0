import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import {
  createPublicClient,
  createWalletClient,
  type Hex,
  http,
  parseEther,
  publicActions
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import type { ICommitment } from "@privacy-pool-v1/domainobjs/ts"
import {
  CCommitment,
  createNewCommitment,
  PrivacyKey
} from "@privacy-pool-v1/domainobjs/ts"
import type { TPrivacyPool } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import {
  ExistingPrivacyPools,
  getOnChainPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"

const basePath = "/artifacts"
const paths = {
  VKEY_PATH: `${basePath}/groth16_vkey.json`,
  WASM_PATH: `${basePath}/PrivacyPool_V1.wasm`,
  ZKEY_PATH: `${basePath}/groth16_pkey.zkey`
}

const decryptCiphers = async (poolID: string, privateKeys: Hex[]) => {
  const keyToCommitJSONs: {
    [privateKey: string]: ReturnType<ICommitment.CommitmentI["toJSON"]>[]
  } = {}

  // get instance of pool
  // TODO Optimise this with cache or a DB so that we don't
  // need to always sync the entire state form scratchs=
  // get meta from poolID

  for (const [chain, metas] of ExistingPrivacyPools.entries()) {
    for (const p of metas) {
      if (p.id === poolID) {
        console.log("decrypt pool id", p.id)
        const instance = getOnChainPrivacyPool(
          p,
          createPublicClient({
            chain: p.chain,
            transport: http()
          })
        )
        const synced = await instance.sync()
        if (!synced) {
          throw new Error("sync failed")
        }
        const privacyKeys = privateKeys.map((privateKey) =>
          PrivacyKey.from(privateKey, 0n)
        )

        await instance.decryptCiphers(privacyKeys)
        for (const key of privacyKeys) {
          const allKeyCommitments = await key.recoverCommitments(instance)
          keyToCommitJSONs[key.pKey] = allKeyCommitments.map((commit) => {
            return commit.toJSON()
          })
        }
      }
    }
  }

  return keyToCommitJSONs
}

// we only need 1 function to handle both commit and releases
// commit is when Sum Output = Sum Input + External Input
// release is shen Sum Output = Sum Input - External Output
const handleRequest = async (
  poolID: string,
  accountKey: Hex,
  _r: TPrivacyPool.RequestT,
  pKs: Hex[],
  nonces: bigint[],
  existingCommitmentJSONs: {
    public: {
      scope: string
      cipher: string[]
      saltPk: string[]
    }
    hash: string
    cRoot: string
    pkScalar: Hex
    nonce: string
  }[],
  newCommitmentValues: string[]
) => {
  console.log("allInputParams:", {
    poolID,
    accountKey,
    _r,
    pKs,
    nonces,
    existingCommitmentJSONs,
    newCommitmentValues
  })
  for (const metas of ExistingPrivacyPools.values()) {
    for (const p of metas) {
      if (p.id === poolID) {
        console.log("pool info:", p)
        const instance = getOnChainPrivacyPool(
          p,
          createPublicClient({
            chain: p.chain,
            transport: http()
          })
        )

        const account = privateKeyToAccount(accountKey)
        const publicAddr = account.address
        const walletClient = createWalletClient({
          account,
          chain: p.chain,
          transport: http()
        }).extend(publicActions)

        console.log("contract address:", instance.meta.address)

        const synced = await instance.sync()
        if (!synced) {
          throw new Error("sync failed")
        }

        const scopeVal = await instance.scope()

        const vKey = await fetch(paths.VKEY_PATH).then((res) => res.text())
        const wasm = await fetch(paths.WASM_PATH).then((res) =>
          res.arrayBuffer()
        )
        const zKey = await fetch(paths.ZKEY_PATH).then((res) =>
          res.arrayBuffer()
        )

        const pkScalars = pKs.map((pk) => deriveSecretScalar(pk))

        console.log("pubAddr", publicAddr)
        console.log(walletClient)

        await instance
          .process(
            walletClient,
            {
              src: publicAddr,
              sink: publicAddr,
              feeCollector: _r.feeCollector,
              fee: _r.fee
            },
            pkScalars,
            nonces,
            [
              CCommitment.CommitmentC.recoverFromJSON(
                existingCommitmentJSONs[0]
              ),
              CCommitment.CommitmentC.recoverFromJSON(
                existingCommitmentJSONs[1]
              )
            ],
            [
              createNewCommitment({
                _pK: pKs[0],
                _nonce: 0n,
                _scope: scopeVal,
                _value: BigInt(newCommitmentValues[0])
              }),
              createNewCommitment({
                _pK: pKs[3],
                _nonce: 0n,
                _scope: scopeVal,
                _value: BigInt(newCommitmentValues[1])
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
          .catch((err) =>
            self.postMessage({ action: "makeCommitErr", payload: err })
          )
      }
    }
  }
}

self.addEventListener("message", async (event) => {
  // Check if the message is to trigger the performComputation function
  if (event.data.action === "makeCommit") {
    try {
      const result = await handleRequest(
        event.data.poolID,
        event.data.accountKey,
        event.data._r,
        event.data.pKs,
        event.data.nonces,
        event.data.existingCommitmentJSONs,
        event.data.newCommitmentValues
      )
      self.postMessage({ action: "makeCommitRes", payload: result })
    } catch (error) {
      self.postMessage({ action: "makeCommitErr", payload: error })
    }
  }

  if (event.data.action === "getKeysCommitments") {
    try {
      const result = await decryptCiphers(
        event.data.poolID,
        event.data.privateKeys
      )
      // Send the result back to the main thread
      self.postMessage({ action: "getKeysCommitmentsRes", payload: result })
    } catch (error) {
      console.error("Error in worker", error)
      // Send the error back to the main thread
      self.postMessage({ action: "getKeysCommitmentsErr", payload: error })
    }
  }
})
