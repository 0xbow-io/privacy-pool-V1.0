import path from "node:path"

export const generic_configs = "configs"
export const generic_src = "src"
export const generic_out = "out"
export const generic_artifacts = "artifacts"
export const generic_test = "test"
export const generic_test_data = "test-data"
export const generic_srcipts = "scripts"
export const generic_circom = "circom"
export const generic_ptau = "ptau"
export const generic_typescript = "ts"

export const project_global = "global"
export const project_zero_knowledge = "zero-knowledge"
export const project_webapp = "webapp"
export const project_core = "core"
export const project_contracts = "contracts"
export const project_privacy_pool = "privacy-pool"
export const project_poa = "proof-of-assocation"

export const project_org = "0xbow-io"
export const project_repo = "privacy-pool-V1.0"

export const project_root_path = path.resolve(__dirname, "../../")
export const project_base_url = `https://raw.githubusercontent.com/${project_org}/${project_repo}/main`
