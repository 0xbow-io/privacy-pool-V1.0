import { download } from "@privacy-pool-v1/global/utils"
import { DeriveURLPath } from "@privacy-pool-v1/global"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"

const url = DeriveURLPath(PrivacyPool.circomArtifacts.ZKEY_PATH)

try {
  console.log("Downloading zKey from: ", url)
  download(url, PrivacyPool.circomArtifacts.ZKEY_PATH)
} catch (error) {
  console.error("Error downloading verifier key:", error)
}
