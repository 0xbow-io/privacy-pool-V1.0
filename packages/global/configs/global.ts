import type { GlobalConfig } from "./type"
import { getPath } from "./utils"
import * as constants from "./constants"

export const globalConf: GlobalConfig = {
  GLOBAL_ARTIFACTS_DIR: getPath(
    constants.project_global,
    constants.generic_artifacts
  ),
  GLOBAL_CONFIGS_DIR: getPath(
    constants.project_global,
    constants.generic_configs
  ),
  GLOBAL_TEST_DATA_DIR: getPath(
    constants.project_global,
    constants.generic_test_data
  ),
  ZERO_KNOWLEDGE_DIR: getPath(constants.project_zero_knowledge),
  CONTRACTS_DIR: getPath(constants.project_contracts),
  WEBAPP_DIR: getPath(constants.project_webapp),
  CORE_TS_DIR: getPath(constants.project_core, constants.generic_typescript),
  NODE_MODULES: getPath("node_modules")
}
