import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { contractArtifacts } from "@privacy-pool-v1/contracts"
import { moveFileIfExists } from "@privacy-pool-v1/global/utils"

await PrivacyPool.build_artifacts().then((verifier) => {
  // Move contract artifacts to the correct location
  moveFileIfExists(verifier, contractArtifacts.Groth16Verifier.srcPath || "")
})
