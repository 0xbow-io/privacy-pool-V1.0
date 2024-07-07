import fs from "node:fs"
import path from "node:path"
import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers"
import hre from "hardhat"

/**
 * Test GROTH16 Verifier Contract with testcases found in the test-data folder
 * these test cases are produced by the script: zero-knowledge/scripts/privacy-pool/genTestVerifierData.ts
 */
describe("Test GROTH16 Verifier Contract", () => {
  const testInputPaths: string[] = Array.from({ length: 4 }, (_, i) => {
    const paths: string[] = []
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
    it(`contract should succesfuly verify proof for ${path}`, async () => {
      const { verifier } = await loadFixture(setup)
      const testdata = JSON.parse(fs.readFileSync(path, "utf-8"))
      const res = await verifier.read.verifyProof(testdata.proof).catch((e) => {
        console.error(e)
        return false
      })
      expect(res).eq(true)
    })
  }
})
