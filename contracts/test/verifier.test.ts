import fs from "node:fs"
import path from "node:path"
import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers"
import hre from "hardhat"

describe("Test GROTH16 Verifier Contract", () => {
  const testInputPaths: string[] = Array.from({ length: 4 }, (_, i) => {
    let paths: string[] = []
    for (let j = 0; j < 5; j++) {
      paths.push(path.resolve("test", "test-data", `testcase_${i}_${j}.json`))
    }
    return paths
  }).flat()

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

      /*
      const proof = {
        pi_a: testdata.proof[0].map((x: string) => BigInt(x)) as bigint[],
        pi_b: testdata.proof[1].map((x: string[]) =>
          x.map((y) => BigInt(y))
        ) as bigint[][],
        pi_c: testdata.proof[2].map((x: string) => BigInt(x)) as bigint[]
      }

      const publicInput = testdata.proof[1].map((x: string) =>
        BigInt(x)
      ) as bigint[]
      */

      const res = await verifier.read.verifyProof(testdata.proof).catch((e) => {
        console.error(e)
        return false
      })

      expect(res).eq(true)
    })
  }
})
