import fs from "fs"
import path from "path"

import {PrivacyPool} from "@privacy-pool-v1/zero-knowledge"
import { generateCircuitInputsFn } from "@privacy-pool-v1/zero-knowledge"


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
 // to remove previous test artifacts
removeDirectoryContents(PrivacyPool.circomkitConf.dirInputs)

// generate new test artifacts
generateCircuitInputsFn(PrivacyPool.test_data_size, PrivacyPool.circomkitConf.dirInputs) 
