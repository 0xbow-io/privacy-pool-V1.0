import type { Hex } from "viem"
import type { Point } from "@zk-kit/baby-jubjub"

export namespace IPrivacyKey {
  export interface privacyKeyI {
    privateKey: Hex
    publicKey: Point<bigint>
    secretKey: Point<bigint>
    nonce: bigint | number
  }
}
