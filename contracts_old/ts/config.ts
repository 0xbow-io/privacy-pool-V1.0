import {
  generic_test,
  generic_src,
  generic_out,
  generic_test_data
} from "@privacy-pool-v1/global"
import { globalConf, getPath } from "@privacy-pool-v1/global"
import type { ContractConfig } from "@privacy-pool-v1/global"
import { resolve } from "node:path"

export const contractConf: ContractConfig = {
  ...globalConf,
  CONTRACT_SRC_PATH: getPath(globalConf.CONTRACTS_DIR, generic_src),
  CONTRACT_OUT_PATH: getPath(globalConf.CONTRACTS_DIR, generic_out),
  CONTRACT_TEST_PATH: getPath(globalConf.CONTRACTS_DIR, generic_test),
  CONTRACT_TEST_DATA_PATH: getPath(globalConf.CONTRACTS_DIR, generic_test, [
    generic_test_data
  ])
}

export type artifactSpec = {
  srcName: string
  srcType: string
  srcPath: string
  outName: string
  outType: string
  outPath: string
}

export const contractArtifacts = {
  PrivacyPool: {
    srcName: "PrivacyPool",
    srcType: "sol",
    srcPath: contractConf.CONTRACT_SRC_PATH,
    outName: "PrivacyPool",
    outType: "json",
    outPath: contractConf.CONTRACT_OUT_PATH
  } as artifactSpec,
  Groth16Verifier: {
    srcName: "groth16_verifier",
    srcType: "sol",
    srcPath: resolve(contractConf.CONTRACT_SRC_PATH, "verifier"),
    outName: "Groth16Verifier",
    outType: "json",
    outPath: contractConf.CONTRACT_OUT_PATH
  } as artifactSpec
}

export const getContractFile = (spec: artifactSpec) => {
  return `${spec.srcPath}/${spec.srcName}`
}

export const getContractOutFile = (spec: artifactSpec) => {
  return `${spec.outPath}/${spec.srcName}.${spec.srcType}/${spec.outName}`
}
