import fs from "node:fs"
import { expect, test, describe, afterEach, beforeAll } from "@jest/globals"
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import type { Commitment } from "@privacy-pool-v1/core-ts/account"
import {
  CreatePrivacyKey,
  CreateCommitment
} from "@privacy-pool-v1/core-ts/account"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import {
  FnGroth16Verifier,
  ComputeScopeFn,
  ProcessFn
} from "@privacy-pool-v1/core-ts/pool"
import type { TPrivacyPool } from "@privacy-pool-v1/core-ts/pool"
import type {
  ICircuit,
  Groth16_VKeyJSONT,
  CircomArtifactT,
  CircomOutputT,
  PackedGroth16ProofT,
  SnarkJSOutputT
} from "@privacy-pool-v1/core-ts/zk-circuit"
import { LeanIMT } from "@zk-kit/lean-imt"
import { poseidon2 } from "poseidon-lite"
import {
  NewPrivacyPoolCircuit,
  FnPrivacyPool,
  genTestData
} from "@privacy-pool-v1/core-ts/zk-circuit"

import {
  createWalletClient,
  createPublicClient,
  publicActions,
  http
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import type { Hex } from "viem"
import { FnCommitment } from "@privacy-pool-v1/core-ts/account"

const privateKey: Hex = "0x" /// need to fetch this from either env or jest args

const verifierAddress: Hex = "0x8c6561ca85229fd0b2a3d652d1734e60f9f57140"
const poolAddress: Hex = "0x52e41dc97ffcc4b67bd50c4253554ea73317be07"

const account = privateKeyToAccount(privateKey)
const publicAddress = account.address
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http()
}).extend(publicActions)

describe("Testing CPrivacyPool", () => {
  describe("should pass with file paths", () => {
    const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
    const privacyPool = NewPrivacyPoolCircuit({
      vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
      wasm: paths.WASM_PATH,
      zKey: paths.ZKEY_PATH
    })

    const onChainVerifier = FnGroth16Verifier.verifyProofFn(sepolia)
    const computeScopeFn = ComputeScopeFn(sepolia)
    const processFn = ProcessFn(walletClient)

    beforeAll(async () => {})

    afterEach(async () => {
      await cleanThreads()
    })

    test("Testing actual commitment", async () => {
      const defaultCommitVal = 1000000000000000n

      const balance = await walletClient.getBalance({ address: publicAddress })

      const pK = CreatePrivacyKey(privateKey)
      const mt = new LeanIMT((a, b) => poseidon2([a, b]))

      const inputs: Commitment[] = [
        CreateCommitment(pK, {
          value: 0n
        }),
        CreateCommitment(pK, {
          value: 0n
        })
      ]

      const outputs: Commitment[] = [
        CreateCommitment(pK, {
          value: 0n
        }),
        CreateCommitment(pK, {
          value: defaultCommitVal < balance ? defaultCommitVal : balance
        })
      ]

      const ciphers = outputs.map(
        (o) => o.cipherText as [bigint, bigint, bigint, bigint]
      )

      const _r: TPrivacyPool._rT = {
        isCommitFlag: true,
        units: defaultCommitVal < balance ? defaultCommitVal : balance,
        fee: 0n,
        account: publicAddress,
        feeCollector: publicAddress
      }
      const _s: TPrivacyPool._sT = {
        ciphertexts: [
          [ciphers[0][0], ciphers[0][1], ciphers[0][2], ciphers[0][3]],
          [ciphers[1][0], ciphers[1][2], ciphers[1][3], ciphers[1][3]]
        ],
        associationProofURI: ""
      }

      const scope = await computeScopeFn(poolAddress, _r)

      console.log(
        "address: ",
        publicAddress,
        " balance: ",
        balance,
        "_r: ",
        _r,
        " scope: ",
        scope
      )

      await privacyPool
        .prove({
          mt: mt,
          maxDepth: 32,
          inputs: inputs,
          outputs: outputs,
          scope: scope
        })(
          //callback fn to verify output on-chain
          async ({
            out
          }): Promise<{
            ok: boolean
            out: PackedGroth16ProofT<bigint>
          }> => {
            expect(out).toBeDefined()
            const packed = FnPrivacyPool.parseOutputFn("pack")(
              out as SnarkJSOutputT
            ) as PackedGroth16ProofT<bigint>
            return {
              ok: await onChainVerifier(verifierAddress, packed),
              out: packed
            }
          }
        )
        .then(async (res) => {
          // cast res
          const _res = res as {
            ok: boolean
            out: PackedGroth16ProofT<bigint>
          }

          expect(_res.ok).toEqual(true)
          console.log("packed output: ", _res.out)

          return processFn(poolAddress, [_r, _s, ..._res.out], _r.units, false)
        })
        .catch((e) => {
          console.error(e)
        })
    }, 10000)
  })
})
