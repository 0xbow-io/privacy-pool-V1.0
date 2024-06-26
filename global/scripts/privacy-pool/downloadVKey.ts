import { download } from "@privacy-pool-v1/global/utils"
import { DeriveURLPath } from "@privacy-pool-v1/global"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"

const url = DeriveURLPath(PrivacyPool.circomArtifacts.VKEY_PATH)

try {
  console.log("Downloading vKey from: ", url)
  download(url, PrivacyPool.circomArtifacts.VKEY_PATH)
} catch (error) {
  console.error("Error downloading verifier key:", error)
}
