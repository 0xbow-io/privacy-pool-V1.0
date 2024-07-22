import type { PrivacyKey } from "@privacy-pool-v1/core-ts/account"
import { CreatePrivacyKey } from "@privacy-pool-v1/core-ts/account"
import { verifySignature } from "maci-crypto"
import type { Ciphertext } from "maci-crypto"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { expect, test, describe, beforeEach } from "bun:test"

describe("Generating a PrivacyKey", () => {
  test("No PrivateKey given, should pass", () => {
    const pk = CreatePrivacyKey()
    expect(pk).toBeDefined()
    expect(pk.pubKey).toBeDefined()
    expect(pk.pubKeyHash).toEqual(pk.pubKey.hash())
  })
  test("Valid PrivateKey given, should pass", () => {
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)

    const pk = CreatePrivacyKey(privateKey)
    expect(pk).toBeDefined()
    expect(pk.publicAddress).toEqual(account.address)
    expect(pk.pubKey).toBeDefined()
    expect(pk.pubKeyHash).toEqual(pk.pubKey.hash())
  })
  test("Invalid privatekey given, should throw error", () => {
    expect(() => {
      CreatePrivacyKey("0x")
    }).toThrow()
  })
})

describe("Test PrivacyKey Functions", () => {
  let pK: PrivacyKey
  beforeEach(() => {
    pK = CreatePrivacyKey()
  })
  test("Test sign()", () => {
    const message = 100n
    const sign_via_sign = pK.sign(message)
    expect(sign_via_sign.R8[0]).not.toBe(0n)
    expect(sign_via_sign.R8[1]).not.toBe(0n)
    expect(sign_via_sign.S).not.toBe(0n)

    // check that a valid signature is produce
    expect(
      verifySignature(message, sign_via_sign, pK.pubKey.rawPubKey)
    ).toBeTrue()
  })

  describe("Test encrypt, encryptor & decryptor", () => {
    const secret = [1n, 2n, 3n]
    const nonce = 1n
    let cipher: Ciphertext
    const pK = CreatePrivacyKey()

    test("Encrypt & Decrypt successfully", () => {
      const cipher = pK.encrypt(secret, nonce)
      expect(cipher).toBeDefined()
      for (const c of cipher) {
        expect(c).not.toBe(0n)
      }

      const plaintext = pK.decrypt(cipher, nonce, secret.length)
      expect(plaintext).toBeDefined()
      plaintext?.forEach((p, i) => {
        expect(p).toEqual(secret[i])
      })
    })

    test("Should not decrypt with a different cipher", () => {
      expect(() => {
        pK.decrypt([3n, 1n, 3n], nonce, secret.length)
      }).toThrow()
    })

    test("Should not decrypt with a different nonce", () => {
      expect(() => {
        pK.decrypt(cipher, nonce + 1n, secret.length)
      }).toThrow()
    })

    test("Should not decrypt with different secret length value", () => {
      expect(() => {
        pK.decrypt(cipher, nonce, secret.length + 1)
      }).toThrow()
    })

    test("Should not decrypt with a different privacy key", () => {
      const pK_b = CreatePrivacyKey()
      expect(() => {
        pK_b.decrypt(cipher, nonce, secret.length)
      }).toThrow()
    })
  })
})
