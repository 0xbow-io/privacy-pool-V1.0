import fs from "node:fs"
import path from "node:path"
import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers"
import hre from "hardhat"

describe("Test GROTH16 Verifier Contract", () => {
  const testInputPaths: Array<string> = Array.from({ length: 10 }, (_, i) =>
    path.resolve("test", "test-data", `testcase_${i}.json`)
  )

  async function setup() {
    const [owner, testAccount] = await Promise.resolve(
      hre.viem.getWalletClients()
    )
    const verifier = await hre.viem.deployContract("Groth16Verifier", [])
    const publicClient = await Promise.resolve(hre.viem.getPublicClient())
    return {
      owner,
      testAccount,
      verifier,
      publicClient
    }
  }

  for (const path of testInputPaths) {
    it(`contract should verify proof from input ${path}`, async () => {
      const { verifier } = await loadFixture(setup)
      const testdata = JSON.parse(fs.readFileSync(path, "utf-8"))

      const proof = {
        pi_a: testdata.outputs.proof.pi_a.map((x: string) =>
          BigInt(x)
        ) as bigint[],
        pi_b: testdata.outputs.proof.pi_b.map((x: string[]) =>
          x.map((y) => BigInt(y))
        ) as bigint[][],
        pi_c: testdata.outputs.proof.pi_c.map((x: string) =>
          BigInt(x)
        ) as bigint[]
      }

      const publicInput = testdata.outputs.publicSignals.map((x: string) =>
        BigInt(x)
      ) as bigint[]

      const res = await Promise.resolve(
        verifier.read.verifyProof([
          [proof.pi_a[0], proof.pi_a[1]],
          [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]]
          ],
          [proof.pi_c[0], proof.pi_c[1]],
          [
            publicInput[0],
            publicInput[1],
            publicInput[2],
            publicInput[3],
            publicInput[4],
            publicInput[5],
            publicInput[6],
            publicInput[7],
            publicInput[8]
          ]
        ])
      )
      expect(res).eq(true)
    })
  }
})
