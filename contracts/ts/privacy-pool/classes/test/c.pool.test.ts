import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"
import fs from "node:fs"

import {
  createWalletClient,
  createPublicClient,
  publicActions,
  http
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import type { Hex } from "viem"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { CPool } from "@privacy-pool-v1/core-ts/pool"
import {
  CreatePrivacyKey,
  CreateCommitment
} from "@privacy-pool-v1/core-ts/account"

const paths = PrivacyPool.circomArtifacts(false)
const privateKey: Hex = ""

const account = privateKeyToAccount(privateKey)
const publicAddress = account.address
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http()
}).extend(publicActions)

describe("Testing CPrivacyPool", () => {
  describe("should pass with file paths", () => {
    const defaultCommitVal = 1000000000000000n
    const pK = CreatePrivacyKey(privateKey)
    const pool = new CPool.poolC({
      poolAddress: "0xFD892E3845B3C16112BBc2581b23da80cD8d8557",
      verifierAddress: "0x542A99775C5Eee7f165cFD19954680AB85d586E5",
      chain: sepolia,
      zkArtifacts: {
        vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
        wasm: paths.WASM_PATH,
        zKey: paths.ZKEY_PATH
      }
    })
    test("Testing actual commitment", async () => {
      const balance = await walletClient.getBalance({ address: publicAddress })
      await pool
        .process(
          walletClient,
          {
            inputs: [
              CreateCommitment(pK, {
                value: 0n
              }),
              CreateCommitment(pK, {
                value: 0n
              })
            ],
            outputs: [
              CreateCommitment(pK, {
                value: 0n
              }),
              CreateCommitment(pK, {
                value: defaultCommitVal < balance ? defaultCommitVal : balance
              })
            ]
          },
          {
            isCommitFlag: true,
            units: defaultCommitVal < balance ? defaultCommitVal : balance,
            fee: 0n,
            account: publicAddress,
            feeCollector: publicAddress
          },
          ""
        )
        .then((res) => {
          expect(res).toBe(true)
        })
        .catch((err) => {
          console.log(err)
        })
    })
  })
})
