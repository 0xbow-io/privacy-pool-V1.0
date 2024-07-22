import {
  LoadRemoteArtifacts,
  InitVerifiersCircuit
} from "@privacy-pool-v1/core-ts/pool"
import { GetVerifier } from "@privacy-pool-v1/core-ts/pool"

LoadRemoteArtifacts().then(({ wasm, zkey, verifierKey }) => {
  InitVerifiersCircuit(wasm, zkey, verifierKey)
  console.log("Remote artifacts loaded")
})
