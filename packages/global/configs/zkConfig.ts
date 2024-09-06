import type { GlobalConfig, circomArtifactPaths } from "./type"
import { getPath, DeriveURLPath } from "./utils"
import { generic_artifacts, generic_circom } from "./constants"
export function getCircomArtifactPaths(
  global: GlobalConfig,
  projectName: string,
  circuitName: string,
  getRemote = false
): circomArtifactPaths {
  console.log('func', global.GLOBAL_ARTIFACTS_DIR, generic_circom)
  const local: circomArtifactPaths = {
    WASM_PATH: getPath(global.GLOBAL_ARTIFACTS_DIR, generic_circom, [
      projectName,
      circuitName,
      `${circuitName}_js`,
      `${circuitName}.wasm`
    ]),
    ZKEY_PATH: getPath(global.GLOBAL_ARTIFACTS_DIR, generic_circom, [
      projectName,
      circuitName,
      "groth16_pkey.zkey"
    ]),
    VKEY_PATH: getPath(global.GLOBAL_ARTIFACTS_DIR, generic_circom, [
      projectName,
      circuitName,
      "groth16_vkey.json"
    ])
  }
  return !getRemote
    ? local
    : {
        WASM_PATH: DeriveURLPath(local.WASM_PATH),
        ZKEY_PATH: DeriveURLPath(local.ZKEY_PATH),
        VKEY_PATH: DeriveURLPath(local.VKEY_PATH)
      }
}
