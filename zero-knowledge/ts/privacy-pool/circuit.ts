
import { globalConf, getPath, getCircomArtifactPaths, DeriveURLPath } from "@privacy-pool-v1/global"
import type {circomArtifactPaths} from "@privacy-pool-v1/global"
import {generic_circom, project_privacy_pool, generic_ptau} from "@privacy-pool-v1/global"
import type { CircomkitConfig, CircuitConfig } from "circomkit"
import { contractArtifacts} from "@privacy-pool-v1/contracts"

import {circomKit} from "@privacy-pool-v1/zero-knowledge";

export namespace PrivacyPool {
  export const test_data_size = 10
  export const circom_target_ver = "2.1.9"

  export const protocol = "groth16"
  export const prime= "bn128"
  export const id = "PrivacyPool_V1"
  export const template = "PrivacyPool"
  export const mainfile = "./privacy-pool/privacyPool"

  export const publicInputs: string[] = [  
    "commitFlag",
    "publicVal",
    "scope",
    "actualMerkleTreeDepth",
    "inputNullifier",
    "outputCommitment"
  ]
  export const privateInputs: string[] = [
      "inputPublicKey",
      "inputValue",
      "inputSalt",
      "inputSigR8",
      "inSigS",
      "inputLeafIndex",
      "merkleProofSiblings",
      "outputPublicKey",
      "outputValue",
      "outputSalt"
  ]
  export const inputs: string[] = publicInputs.concat(privateInputs)
  export const outputs: string[] = ["merkleRoot"]

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
  // for local refereces through file paths
  export const circomArtifacts: circomArtifactPaths = getCircomArtifactPaths(globalConf, project_privacy_pool, id)

  // for web references through URLs
  export const circomArtifacts_remnote: circomArtifactPaths = {
    WASM_PATH: DeriveURLPath(circomArtifacts.WASM_PATH),
    ZKEY_PATH: DeriveURLPath(circomArtifacts.ZKEY_PATH),
    VKEY_PATH: DeriveURLPath(circomArtifacts.VKEY_PATH),
  }

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

    await circuit.generate_contract(contractArtifacts.Groth16Verifier.srcPath).then(() => {
        console.log("generated contract at ", contractArtifacts.Groth16Verifier.srcPath)
    }).catch((err) => {
        console.error(err)
    })
  }
}



