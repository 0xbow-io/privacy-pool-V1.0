import { resolve } from "node:path"
import {
  contractArtifacts,
  generateAbiFile,
  getContractOutFile
} from "@privacy-pool-v1/contracts"
import {
  globalConf,
  generic_typescript,
  generic_artifacts,
  project_privacy_pool
} from "@privacy-pool-v1/global"

const basePath = resolve(
  globalConf.CONTRACTS_DIR,
  generic_typescript,
  project_privacy_pool,
  generic_artifacts
)
for (const entry of Object.entries(contractArtifacts)) {
  generateAbiFile(
    getContractOutFile(entry[1]),
    resolve(basePath, `${entry[0]}`)
  )
}
