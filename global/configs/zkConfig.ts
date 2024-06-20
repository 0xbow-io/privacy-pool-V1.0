import type { GlobalConfig, circomArtifactPaths } from "./type"
import { getPath } from "./utils"
import {generic_circom} from "./constants"


export function getCircomArtifactPaths(global: GlobalConfig, projectName: string, circuitName: string): circomArtifactPaths {
  return {
    WASM_PATH: getPath(global.GLOBAL_ARTIFACTS_DIR, generic_circom, [
      projectName,
      circuitName,
      circuitName + "_js",
      circuitName + ".wasm"
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
}