import { PrivacyKey, CreatePrivacyKey } from '@core/account/classes';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { TPrivacyKey } from '@core/account/types';
import { Ciphertext } from 'maci-crypto';

describe('Generating a PrivacyKey', () => {
  test('No PrivateKey given, should pass', () => {
    const pk = CreatePrivacyKey();
    expect(pk).toBeDefined();
    expect(pk.pubKey).toBeDefined();
    expect(pk.pubKeyHash).toEqual(pk.pubKey.hash());
    expect(pk.signer).toBeDefined();
    expect(pk.encryptor).toBeDefined();
  });
  test('Valid PrivateKey given, should pass', () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    const pk = CreatePrivacyKey(privateKey);
    expect(pk).toBeDefined();
    expect(pk.publicAddress).toEqual(account.address);
    expect(pk.pubKey).toBeDefined();
    expect(pk.pubKeyHash).toEqual(pk.pubKey.hash());
    expect(pk.signer).toBeDefined();
    expect(pk.encryptor).toBeDefined();
  });
  test('Invalid privatekey given, should throw error', () => {
    expect(() => {
      CreatePrivacyKey('0x');
    }).toThrow();
  });
});

describe('Test PrivacyKey Functions', () => {
  let pK: PrivacyKey;
  beforeEach(() => {
    pK = CreatePrivacyKey();
  });
  test('Test signer & sign()', () => {
    const message = 100n;
    const signature_via_signer = pK.signer(message);
    expect(signature_via_signer.R8[0]).not.toBe(0n);
    expect(signature_via_signer.R8[1]).not.toBe(0n);
    expect(signature_via_signer.S).not.toBe(0n);

    const sign_via_sign = pK.sign(message);
    expect(sign_via_sign.R8[0]).not.toBe(0n);
    expect(sign_via_sign.R8[1]).not.toBe(0n);
    expect(sign_via_sign.S).not.toBe(0n);

    expect(signature_via_signer.R8[0]).toEqual(sign_via_sign.R8[0]);
    expect(signature_via_signer.R8[1]).toEqual(sign_via_sign.R8[1]);
    expect(signature_via_signer.S).toEqual(sign_via_sign.S);
  });

  describe('Test encrypt, encryptor & decryptor', () => {
    const secret = [1n, 2n, 3n];
    const nonce = 1n;
    let encryptor: TPrivacyKey.EncryptorT;
    let decryptor: TPrivacyKey.DecryptorT;
    let cipher: Ciphertext;

    beforeEach(() => {
      const pK = CreatePrivacyKey();
      encryptor = pK.encryptor;
      decryptor = pK.decryptor;
      cipher = pK.encrypt(secret, nonce);
    });

    test('Encrypt successfully', () => {
      const cipher_via_encryptor = encryptor(secret, nonce);
      expect(cipher_via_encryptor).toBeDefined();
      cipher_via_encryptor.forEach((c) => {
        expect(c).not.toBe(0n);
      });

      expect(cipher).toBeDefined();
      cipher_via_encryptor.forEach((c, i) => {
        expect(c).toEqual(cipher[i]);
      });
    });

    test('Decrypt successfully', () => {
      const plaintext = decryptor(cipher, nonce, secret.length);
      expect(plaintext).toBeDefined();
      plaintext!.forEach((p, i) => {
        expect(p).toEqual(secret[i]);
      });
    });

    test('Should not decrypt with a different cipher', () => {
      expect(() => {
        decryptor([3n, 1n, 3n], nonce, secret.length);
      }).toThrow();
    });

    test('Should not decrypt with a different nonce', () => {
      expect(() => {
        decryptor(cipher, nonce + 1n, secret.length);
      }).toThrow();
    });

    test('Should not decrypt with different secret length value', () => {
      expect(() => {
        decryptor(cipher, nonce, secret.length + 1);
      }).toThrow();
    });

    test('Should not decrypt with a different privacy key', () => {
      const pK_b = CreatePrivacyKey();
      expect(() => {
        pK_b.decryptor(cipher, nonce, secret.length);
      }).toThrow();
    });
  });
});
