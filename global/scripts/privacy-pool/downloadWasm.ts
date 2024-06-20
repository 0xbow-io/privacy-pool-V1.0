import {download, DeriveURLPath} from "@privacy-pool-v1/global"
import {PrivacyPool} from "@privacy-pool-v1/zero-knowledge"

const url = DeriveURLPath(PrivacyPool.circomArtifacts.WASM_PATH)

try {
    console.log("Downloading wasm from: ", url)
    download(url, PrivacyPool.circomArtifacts.WASM_PATH)
} catch (error) {
    console.error("Error downloading verifier key:", error)
}


