import fs from "node:fs"
import path from "node:path"

import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import { contractConf } from "@privacy-pool-v1/contracts"
import { stringifyBigInts } from "maci-crypto"

import { cleanThreads } from "@privacy-pool-v1/global"

const verifierKey = JSON.parse(
  fs.readFileSync(PrivacyPool.circomArtifacts.VKEY_PATH, "utf-8")
)

const testInputPath: Array<string> = Array.from(
  { length: PrivacyPool.test_data_size },
  (_, i) =>
    path.resolve(PrivacyPool.circomkitConf.dirInputs, `testcase_${i}.json`)
)

if (testInputPath.length === 0) {
  throw new Error("No test circuit data found.")
}

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
  inputPath: string,
  outputPath: string
): Promise<void> {
  const circuitInputs = JSON.parse(fs.readFileSync(inputPath, "utf-8"))
  const out = await FnPrivacyPool.ProveFn(
    circuitInputs.inputs,
    PrivacyPool.circomArtifacts.WASM_PATH,
    PrivacyPool.circomArtifacts.ZKEY_PATH
  )
  const ok = await FnPrivacyPool.VerifyFn(
    verifierKey,
    out.publicSignals,
    out.proof
  )
  if (!ok) {
    throw new Error(`Failed to generate proof for ${inputPath}`)
  }
  const parsed = FnPrivacyPool.ParseFn(out.proof, out.publicSignals)
  exportToJSON(
    {
      inputs: stringifyBigInts(circuitInputs),
      outputs: stringifyBigInts(parsed)
    },
    outputPath
  )
}

testInputPath.forEach(async (inputPath, i) => {
  await exportProof(
    inputPath,
    path.join(contractConf.CONTRACT_TEST_DATA_PATH || "", `testcase_${i}.json`)
  )
})

await cleanThreads()
