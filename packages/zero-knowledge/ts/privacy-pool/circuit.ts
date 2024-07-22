import {
  globalConf,
  getPath,
  getCircomArtifactPaths
} from "@privacy-pool-v1/global"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import {
  generic_circom,
  project_privacy_pool,
  generic_ptau
} from "@privacy-pool-v1/global"
import type { CircomkitConfig, CircuitConfig } from "circomkit"

import { circomKit } from "@privacy-pool-v1/zero-knowledge"

export namespace PrivacyPool {
  export const test_data_size = 10
  export const circom_target_ver = "2.1.9"

  export const protocol = "groth16"
  export const prime = "bn128"
  export const id = "PrivacyPool_V1"
  export const template = "PrivacyPool"
  export const mainfile = "./privacy-pool/privacyPool"

  export const publicInputs: string[] = [
    "scope",
    "actualTreeDepth",
    "context",
    "externIO",
    "existingStateRoot",
    "newSaltPublicKey",
    "newCiphertext"
  ]
  export const privateInputs: string[] = [
    "privateKey",
    "nonce",
    "exSaltPublicKey",
    "exCiphertext",
    "exIndex",
    "exSiblings"
  ]
  export const inputs: string[] = publicInputs.concat(privateInputs)
  export const outputs: string[] = [
    "newNullRoot",
    "newCommitmentRoot",
    "newCommitmentHash"
  ]

  export const default_params = [32, 7, 4, 2, 2]

  export const dependencies: string[] = [
    getPath(globalConf.NODE_MODULES, "circomlib", ["circuits"]),
    getPath(globalConf.NODE_MODULES, "@zk-kit", [
      "binary-merkle-root.circom",
      "src"
    ]),
    getPath(globalConf.NODE_MODULES, "@zk-kit", [
      "poseidon-cipher.circom",
      "src"
    ]),
    getPath(globalConf.NODE_MODULES, "@zk-kit", ["ecdh.circom", "src"]),
    getPath(globalConf.NODE_MODULES, "@zk-kit", ["utils.circom", "src"]),
    getPath(globalConf.NODE_MODULES, "maci-circuits", ["circom", "utils"])
  ]

  export const circomArtifacts = (remote = false): circomArtifactPaths =>
    getCircomArtifactPaths(globalConf, project_privacy_pool, id, remote)

  export const circomkitConf: CircomkitConfig = {
    protocol: protocol,
    prime: prime,
    version: circom_target_ver,
    circuits: getPath(globalConf.ZERO_KNOWLEDGE_DIR, generic_circom, [
      "circuits.json"
    ]),
    dirCircuits: getPath(globalConf.ZERO_KNOWLEDGE_DIR, generic_circom),
    dirInputs: getPath(globalConf.GLOBAL_TEST_DATA_DIR, generic_circom, [
      project_privacy_pool
    ]),
    dirPtau: getPath(globalConf.GLOBAL_ARTIFACTS_DIR, generic_circom, [
      project_privacy_pool,
      generic_ptau
    ]),
    dirBuild: getPath(globalConf.GLOBAL_ARTIFACTS_DIR, generic_circom, [
      project_privacy_pool
    ]),
    circomPath: generic_circom,
    optimization: 2,
    groth16numContributions: 1,
    groth16askForEntropy: false,
    prettyCalldata: false,
    inspect: false,
    logLevel: "INFO",
    verbose: true,
    cWitness: false,
    include: dependencies
  }

  export const circuitConf: CircuitConfig = {
    file: mainfile,
    template: template,
    pubs: publicInputs,
    params: default_params
  }

  export const circomkit = (_circuitConf = circuitConf) =>
    new circomKit(id, circomkitConf, _circuitConf)

  export const build_artifacts = async (): Promise<string> => {
    const circuit = circomkit()
    await circuit
      .build()
      .then(() => {
        console.log("built circuit artifacts")
      })
      .catch((err) => {
        console.error(err)
      })

    const verifierPath = await circuit
      .generate_contract()
      .then((path) => {
        console.log("generated contract at ", path)
        return path
      })
      .catch((err) => {
        console.error(err)
        return ""
      })
    return verifierPath
  }
}
