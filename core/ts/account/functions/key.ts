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

/*

// Account can hold multiple keys
//  privacy keypair is derived from base keypair
//  base keypair is utilised for EVM transactions
//    privacy keypair is for privacy-preserving utilities
//
// ECDH shared secret generated from salt
//    shared secret is utilised as an encryption key
//
// ECDH(pubK & salt) -> eK: ECDH(salt_pubK, privK)
//    commitment is encrypted with the shared secret ek
//
// ECDH shared secret can be used for Poseidon Encryption
// along with a nonce value:
//    poseidonEncrypt(commitment, eK, nonce) -> ciphertext
//
// Decryption requires the knowledge of the length of the plaintext
// poseidonDecrypt(cipherText, eK, nonce, len(commitment)) -> commitment


account: [{
  // Base keypair
  pK : ECDSA privatekey (secp256k1)
  Pk: ECDSA publickey (secp256k1)

  // privacy keypair
  // derived form base keypair
  privacyK: {
    privK: EdDSA privatekey
    pubK: EdDSA publickey = {
      pubK_x, pubK_y
    },
    // shared secret as encryption key
    // generated from pairing privK, pubK
    eK,
    // counter that increments per key generation
    Nonce
    ]
}

commimtment: tuple([value, pubK_x, pubK_y, Salt])
commimtment_hash: Poseidon(4)([value, pubK_x, pubK_y, Salt])



(1) Commitment ==> Nullifier transmuatation:
- get commitment hash & it's associated ciphertext and leaf index
- generate merkle proof for leaf index
- attempt to decrypt ciphertext with ek, nonce, len(commitment) => commitment: [value, pubK_x, pubK_y, c_salt]
- use c_salt to generate signature of ciphertext

  // this binds the value's proof of existence
  // with its the value's representation
  // by having one of the commiments tuple members
  // generate a signature of the commitments ciphertext
  // Hence communicating that prover is:
  //  --- able to reproduce a commitment hash from the ciphertext
  //  --- able to prove commitment hash exists in the merkle tree
- construct nullifier tuple: [commitment hash, leaf index, sigR8_x, sigR8_y, sigS]
- commit nullifier hash to Poseidon(5)([commitment hash, leaf index, sigR8_x, sigR8_y, sigS]) => nullifier_hash


(2) Generating a commitment for any abitary value
- gneerate salt for commitment,  c_salt
- construct commitment tuple: [value, pubK_x, pubK_y, c_salt]
- compute commitment hash: Poseidon(4)([value, pubK_x, pubK_y, Salt])
- encrypt commitment with ek and nonce => ciphertext




0xBow.io is currently exploring various Zk (zero-knoweldge) techniques / technologies / implementations
with the intention of designing a privacy-preserving model which:
- at all times maintain value preservation:
  - without revealing the value itself (i.e. privacy through zero-knowledge)
  - even if a predicate function would be applied to the value (i.e. verifiable computation through zero-knowledge)
  - or some kind of transmutation would be applied to the value (i.e. privacy through zero-knowledge)

We hope that in doing this excersise, we can contribute to the zk & privacy community with utilities & libraries that are interoperable with existing systems.

________________________________________________________________________________________________________________________

Achieving private value preservation is a fundamental requirement for any privacy-preserving system.

Any arbitary values (i.e. 10 atom) can be considered "preserved" if its operable existence in some domain can be proven.
The term "Privacy Pool" represents such domain and can be characterized by a structured set,
for which set-membership can be proven for all set elements.

The traditional implementation would be a "leaf" set where leaves are orderly hashed to compute a unique merkle-root.
Therefore an element has sufficient membership if it's merkle proof can be verified against the set's merkle-root.

For Privacy Pool V1, we've opted for the lean incremental merkle tree implementation by the PSE team (privacy-scaling-explorations)
: https://github.com/privacy-scaling-explorations/zk-kit.solidity/tree/main/packages/imt

Important to note that values can not self-preserve, as only "commitments", which are representations of values, can be preserved.
A commitment binds the value to external elements available within the domain space.
This binding requires that the value is "owned" by an account: an entity which can compute commitments and commit them to the domain.

A standard commitment is the tuple: [value, pubK, salt]
  * where salt is a random BabyJub value
  * pubK is the account's public key.
  * commitment hash = hashing (binding) the tuple elements together.
  * account commits commitment hash to the domain.

Although the internals of the tuple is only known to the account, commitments are not sufficient for privacy-preservation.
Commitment hash does not preserve the value (that information is considered lost) and instead serves to provide incomplete domain membership for the value.

ECDH Secrets are generated through Salts, which are random BabyJub values.
Pairing the account's public key with a Salt generates a shared secret:
  (salt, pubK) => secret

Such that when computing a public key with the same Salt: Salt -> Salt_pubK
and pairing it with the accounts private key, the same sereet value will be generatedt:
  (salt_pubK, privK) => secret

An important utlity of the shared secret is the ability to encrypt and decrypt messages using Poseidon Encryption.

ECDH shared secret can be used for Poseidon Encryption along with a nonce value:
poseidonEncrypt(plaintext, {secret}, nonce) -> ciphertext

Decryption requires the knowledge of the length of the plaintext
poseidonDecrypt(cipherText, {secret}, nonce, len(plaintext)

0xBow Privacy Pool is an

Assuming a filter fn(inputs) -> outputs




*/
