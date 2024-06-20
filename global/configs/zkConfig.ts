import type { GlobalConfig } from "./type"
import { getPath } from "./utils"
import {generic_circom} from "./constants"


export function circomArtifactPaths(global: GlobalConfig, projectName: string, circuitName: string) {
  return {
    LOCAL_WASM_PATH: getPath(global.GLOBAL_ARTIFACTS_DIR, generic_circom, [
      projectName,
      circuitName,
      circuitName + "_js",
      circuitName + ".wasm"
    ]),
    LOCAL_ZKEY_PATH: getPath(global.GLOBAL_ARTIFACTS_DIR, generic_circom, [
      projectName,
      circuitName,
      "groth16_pkey.zkey"
    ]),
    LOCAL_VKEY_PATH: getPath(global.GLOBAL_ARTIFACTS_DIR, generic_circom, [
      projectName,
      circuitName,
      "groth16_vkey.json"
    ])
    //TO-DO add URL paths
  }
}