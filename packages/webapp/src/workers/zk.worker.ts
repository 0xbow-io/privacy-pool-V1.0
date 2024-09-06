import { eventListenerFn } from "./eventListener"

const basePath = "/artifacts"
const paths = {
  VKEY_PATH: `${basePath}/groth16_vkey.json`,
  WASM_PATH: `${basePath}/PrivacyPool_V1.wasm`,
  ZKEY_PATH: `${basePath}/groth16_pkey.zkey`
}

// forward messages from the main thread
// to the event listener function
self.addEventListener("message", eventListenerFn)
