import fs from "node:fs"
import path from "node:path"

import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { genTestCircuitInputsFn } from "@privacy-pool-v1/zero-knowledge"
import type { Commitment } from "@privacy-pool-v1/core-ts/account"
import type { TPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"

import { stringifyBigInts } from "maci-crypto"
function removeDirectoryContents(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory ${dirPath} does not exist.`)
    return
  }

  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      removeDirectoryContents(filePath)
      fs.rmdirSync(filePath)
    } else {
      fs.unlinkSync(filePath)
    }
  }
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

function dumpTestData(
  testData: {
    io: {
      inputs: TPrivacyPool.InT
      ouptuts: bigint[]
    }
    commitments: {
      inCommitments: Commitment[]
      outCommitments: Commitment[]
    }
  }[],
  outputDir?: string,
  filePrefix?: string
) {
  testData.forEach((data, i) => {
    exportToJSON(
      {
        inputs: data.io.inputs,
        commitments: {
          inCommitments: data.commitments.inCommitments.map((c) =>
            stringifyBigInts(c.asStringValues())
          ),
          outCommitments: data.commitments.outCommitments.map((c) =>
            stringifyBigInts(c.asStringValues())
          )
        },
        ouptuts: stringifyBigInts(data.io.ouptuts)
      },
      path.join(outputDir || "", `${filePrefix || "testcase_"}_${i}.json`)
    )
  })
}

// to remove previous test artifacts
removeDirectoryContents(PrivacyPool.circomkitConf.dirInputs)

// generate new test artifacts
dumpTestData(
  genTestCircuitInputsFn(PrivacyPool.test_data_size),
  PrivacyPool.circomkitConf.dirInputs
)
