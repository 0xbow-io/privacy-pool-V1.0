import type { TPrivacyKey } from "@privacy-pool-v1/core-ts/account/types"
import type { Hex } from "viem"
import type {
  Signature,
  EcdhSharedKey,
  Ciphertext,
  Plaintext
} from "maci-crypto"
import type { PubKey } from "maci-domainobjs"

import { Keypair, PrivKey } from "maci-domainobjs"
import {
  genEcdhSharedKey,
  sign,
  poseidonEncrypt,
  poseidonDecrypt
} from "maci-crypto"
import { hashLeftRight } from "maci-crypto"

import { hexToBigInt } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

export namespace FnPrivacyKey {
  export function HashhPubKeyFn(pubKey: PubKey): bigint {
    return hashLeftRight(pubKey.rawPubKey[0], pubKey.rawPubKey[1])
  }
  export function GenPrivacyKeyFn(pK = generatePrivateKey()): TPrivacyKey.KeyT {
    const _privacyKey: TPrivacyKey.KeyT = {
      privateKey: pK,
      account: privateKeyToAccount(pK),
      keypair: new Keypair(new PrivKey(hexToBigInt(pK)))
    }

    _privacyKey.eK = genEcdhSharedKey(
      _privacyKey.keypair.privKey.rawPrivKey,
      _privacyKey.keypair.pubKey.rawPubKey
    )

    return _privacyKey
  }
  export function SignMsgFn(msg: bigint, pK: string): Signature {
    if (pK === "") {
      throw new Error("empty key given")
    }
    try {
      return sign(pK, msg)
    } catch (error) {
      console.log("Error signing message", { cause: error })
      throw new Error("Error signing message", { cause: error })
    }
  }

  export function EncryptFn(
    secret: Plaintext,
    nonce: bigint,
    eK: EcdhSharedKey
  ): Ciphertext {
    return poseidonEncrypt(secret, eK, nonce)
  }

  export function DecryptFn(
    cipher: Ciphertext,
    nonce: bigint,
    secretLen: number,
    eK: EcdhSharedKey
  ): Plaintext {
    try {
      return poseidonDecrypt(cipher, eK, nonce, secretLen)
    } catch (error) {
      throw new Error("Error decrypting", { cause: error })
    }
  }
}