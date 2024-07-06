import fs from "node:fs"
import path from "node:path"

import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import { contractConf } from "@privacy-pool-v1/contracts"

import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import { GenTestCases } from "@privacy-pool-v1/core-ts/zk-circuit"

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"

const tcs = GenTestCases()()

const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
const prover = FnPrivacyPool.ProveFn(paths.WASM_PATH, paths.ZKEY_PATH)
const verifier = FnPrivacyPool.VerifyFn(
  fs.readFileSync(paths.VKEY_PATH, "utf-8")
)

function exportToJSON(data: any, filePath: string): void {
  try {
    const jsonData = JSON.stringify(data, null, 2) // Convert the object to JSON with pretty formatting
    fs.writeFileSync(filePath, jsonData) // Write the JSON data to the file
    console.log(`Data exported successfully to ${filePath}`)
  } catch (err) {
    console.error("Error exporting data:", err)
  }
}

async function exportProof(
  baseOutPath: string = contractConf.CONTRACT_TEST_DATA_PATH || ""
): Promise<void> {
  tcs.forEach(async (testVariants, i) => {
    let k = 0
    for (const tc of testVariants) {
      const out = await prover(tc.inputs)
      const ok = await verifier(out)

      if (!ok) {
        throw new Error(`Failed to generate proof for ${tc.case}`)
      }
      const packed = FnPrivacyPool.parseOutputFn("pack")(out)
      exportToJSON(
        {
          inputs: tc.inputs,
          proof: packed
        },
        path.join(baseOutPath, ` testcase_${i}_${k}.json`)
      )
      k++
    }
  })
}

await exportProof()
await cleanThreads()
