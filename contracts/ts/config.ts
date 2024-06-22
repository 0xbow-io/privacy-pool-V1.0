
import {generic_test, generic_src, generic_test_data} from "@privacy-pool-v1/global"
import { globalConf, getPath, } from "@privacy-pool-v1/global"
import type {ContractConfig} from "@privacy-pool-v1/global"

export const contractConf: ContractConfig  = {
    ...globalConf,
    CONTRACT_SRC_PATH: getPath(globalConf.CONTRACTS_DIR, generic_src),
    CONTRACT_TEST_PATH: getPath(globalConf.CONTRACTS_DIR, generic_test),
    CONTRACT_TEST_DATA_PATH: getPath(globalConf.CONTRACTS_DIR, generic_test, [generic_test_data])
}

