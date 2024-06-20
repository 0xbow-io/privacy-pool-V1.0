import { type CircomkitConfig } from "circomkit"

export type ProjectPaths = {
  ZERO_KNOWLEDGE_DIR: string
  CONTRACTS_DIR: string
  WEBAPP_DIR: string
  CORE_TS_DIR: string
  NODE_MODULES: string
}

export type GlobalConfig = ProjectPaths & {
  GLOBAL_ARTIFACTS_DIR: string
  GLOBAL_CONFIGS_DIR: string
  GLOBAL_TEST_DATA_DIR: string
}

export type ZKConfig = GlobalConfig & {
  circom: {
    circuitID: string
    circomkit: CircomkitConfig
  }
  paths: {
    LOCAL_WASM_PATH: string
    LOCAL_ZKEY_PATH: string
    LOCAL_VKEY_PATH: string
  }
}

export type ContractConfig = GlobalConfig & {
  CONTRACT_SRC_PATH: string
  COPNTRACT_TEST_PATH: string
  COPNTRACT_TEST_DATA_PATH: string
}
