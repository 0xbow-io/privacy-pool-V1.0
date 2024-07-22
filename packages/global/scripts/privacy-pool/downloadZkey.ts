import { download } from "@privacy-pool-v1/global/utils/download"
import { DeriveURLPath } from "@privacy-pool-v1/global"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"

const remotePaths = PrivacyPool.circomArtifacts(true)
const url = DeriveURLPath(remotePaths.ZKEY_PATH)

const localPaths = PrivacyPool.circomArtifacts(false)

try {
  console.log("Downloading vKey from: ", url)
  download(url, localPaths.ZKEY_PATH)
} catch (error) {
  console.error("Error downloading verifier key:", error)
}
