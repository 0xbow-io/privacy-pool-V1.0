import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge/ts/circuit.ts"
import { contractArtifacts } from "@privacy-pool-v1/contracts"
import { moveFileIfExists } from "@privacy-pool-v1/global/utils/file"

await PrivacyPool.build_artifacts().then((paths) => {
  // Move contract artifacts to the correct location
  const [circuitName, outDir] = paths
  moveFileIfExists(`${outDir}/groth16_vkey.json`, `packages/webapp/public/artefacts`)
  moveFileIfExists(`${outDir}/groth16_pkey.zkey`, `packages/webapp/public/artefacts`)
  moveFileIfExists(`${outDir}/${circuitName}_js/${circuitName}.wasm`, `packages/webapp/public/artefacts`)
  moveFileIfExists(`${outDir}/groth16_verifier.sol`, contractArtifacts.Groth16Verifier.srcPath || "")
})
