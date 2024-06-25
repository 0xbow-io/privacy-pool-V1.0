import {
  contractArtifacts,
  generateAbiFile,
  getContractOutFile
} from "@privacy-pool-v1/contracts"
import { globalConf, project_contracts } from "@privacy-pool-v1/global"
import { resolve } from "node:path"

// for each specified aritfacts
// generate the typescript abi bindings

const basePath = resolve(
  globalConf.GLOBAL_ARTIFACTS_DIR,
  project_contracts,
  "abi-ts"
)
for (const entry of Object.entries(contractArtifacts)) {
  generateAbiFile(
    getContractOutFile(entry[1]),
    resolve(basePath, `${entry[0]}`)
  )
}
