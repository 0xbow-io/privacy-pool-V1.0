
import { globalConf, getPath, circomArtifactPaths} from "@privacy-pool-v1/global"
import {generic_circom, project_privacy_pool, generic_ptau} from "@privacy-pool-v1/global"
import type { CircomkitConfig, CircuitConfig } from "circomkit"
import { contractConf} from "@privacy-pool-v1/contracts"

import {circomKit} from "@privacy-pool-v1/zero-knowledge";

export namespace PrivacyPool {
  export const test_data_size = 10
  export const circom_target_ver = "2.1.9"

  export const protocol = "groth16"
  export const prime= "bn128"
  export const id = "PrivacyPool_V1"
  export const template = "PrivacyPool"
  export const mainfile = "./privacy-pool/privacyPool"

  export const inputs: string[] = [
      "publicVal",
      "signalHash",
      "actualMerkleTreeDepth",
      "inputNullifier",
      "inUnits",
      "inPk",
      "inBlinding",
      "inSigR8",
      "inSigS",
      "inLeafIndices",
      "merkleProofSiblings",
      "outCommitment",
      "outUnits",
      "outPk",
      "outBlinding"
  ]
  export const outputs: string[] = ["merkleRoot"]
  export const publicInputs: string[] = [  
      "publicVal",
      "signalHash",
      "actualMerkleTreeDepth",
      "inputNullifier",
      "outCommitment"
  ]
  export const default_params = [32, 2, 2]

  export const dependencies: string[] =  [
      getPath(globalConf.NODE_MODULES, "circomlib", ["circuits"]),
      getPath(globalConf.NODE_MODULES, "@zk-kit", [
          "binary-merkle-root.circom",
          "src"
      ]),
      getPath(globalConf.NODE_MODULES, "@zk-kit", [
          "circuits",
          "circom",
      ]),
      getPath(globalConf.NODE_MODULES, "@zk-kit", [
          "poseidon-cipher.circom",
          "src"
      ]),
      getPath(globalConf.NODE_MODULES, "maci-circuits", ["circom", "utils"])
  ]

  export const circomArtifacts = circomArtifactPaths(globalConf, project_privacy_pool, id)

  export const circomkitConf: CircomkitConfig = {
    protocol: protocol,
    prime: prime,
    version: circom_target_ver,
    circuits: getPath(globalConf.ZERO_KNOWLEDGE_DIR, generic_circom, [
      "circuits.json"
    ]),
    dirCircuits: getPath(globalConf.ZERO_KNOWLEDGE_DIR, generic_circom),
    dirInputs: getPath(globalConf.GLOBAL_TEST_DATA_DIR, generic_circom,[
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

  export const circomkit = () => new circomKit(
    id,
    circomkitConf,
    circuitConf
  )


  export async function build_artifacts()  {
    const circuit = circomkit()
    await circuit.build().then(() => {
        console.log("built circuit artifacts")
    }).catch((err) => {
        console.error(err)
    })

    await circuit.generate_contract(contractConf.CONTRACT_SRC_PATH).then(() => {
        console.log("generated contract at ", contractConf.CONTRACT_SRC_PATH)
    }).catch((err) => {
        console.error(err)
    })
  }
}



