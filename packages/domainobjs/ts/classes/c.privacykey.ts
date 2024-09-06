import type { Point } from "@zk-kit/baby-jubjub"
import type { CipherText } from "@zk-kit/poseidon-cipher"
import type { Hex } from "viem"
import type { TCommitment } from "@privacy-pool-v1/domainobjs"
import type { OnChainPrivacyPool } from "@privacy-pool-v1/contracts"
import type { Commitment } from "@privacy-pool-v1/domainobjs"

import {
  ConstCommitment,
  CreateNewCommitment,
  DerivePrivacyKeys,
  RecoverCommitment
} from "@privacy-pool-v1/domainobjs"
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import { poseidonEncrypt } from "@zk-kit/poseidon-cipher"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

export type PrivacyKeys = PrivacyKey[]
export const RecoverCommitments = (
  keys: PrivacyKeys,
  ciphers: {
    rawSaltPk: [bigint, bigint]
    rawCipherText: [bigint, bigint, bigint, bigint, bigint, bigint, bigint]
    commitmentHash: bigint
    cipherStoreIndex: bigint
  }[]
): Commitment[][] =>
  keys.map((key) =>
    ciphers
      .map((cipher) =>
        key.decryptCipher(
          cipher.rawSaltPk,
          cipher.rawCipherText,
          cipher.commitmentHash,
          cipher.cipherStoreIndex
        )
      )
      .filter((v) => v !== undefined)
  )

export type PrivacyKeyJSON = {
  _nonce: string
  privateKey: Hex
  pubAddr: Hex
  _knownSecrets: {
    [key: string]: [string, string, string, string][]
  }
}

export class PrivacyKey {
  _nonce: bigint
  _pkScalar: bigint
  _secret: Point<bigint>
  pKey: Hex

  // Mapping of Scope to
  // Minimum required elements that can
  // recover a commitment & it's nullRoot and commitmentRoot
  // --> scope: (value, saltPk, idx)[]
  // where idx is the index in the Pool's CipherStore
  // note: we do not care about void commitments
  _knownSecrets: Map<bigint, [bigint, bigint, bigint, bigint][]> = new Map()

  constructor(privateKey: Hex, nonce = BigInt(0)) {
    this._nonce = nonce

    const keys = DerivePrivacyKeys(privateKey)()
    this._pkScalar = keys.ScalarPrivKey
    this._secret = keys.Secret
    this.pKey = privateKey
  }

  static generate = (nonce: bigint): PrivacyKey => {
    return new PrivacyKey(generatePrivateKey(), nonce)
  }

  static from = (key: Hex, nonce: bigint): PrivacyKey => {
    return new PrivacyKey(key, nonce)
  }

  get pKScalar(): bigint {
    return this._pkScalar
  }

  get nonce(): bigint {
    return this._nonce
  }

  get Pk(): Point<bigint> {
    return mulPointEscalar(Base8, this.pKScalar)
  }

  get publicAddr(): Hex {
    const account = privateKeyToAccount(this.pKey)
    const publicAddress = account.address
    return publicAddress
  }

  get secretK(): Point<bigint> {
    return this._secret
  }

  get asJSON(): PrivacyKeyJSON {
    return {
      _nonce: this._nonce.toString(),
      privateKey: this.pKey,
      pubAddr: this.publicAddr,
      _knownSecrets: Object.fromEntries(this._knownSecrets)
    }
  }

  eK_FromSaltPk = (saltPk: Point<bigint>): Point<bigint> =>
    mulPointEscalar(saltPk, this.pKScalar)

  /**
   * Add a commitment to the knownSecrets map
   * only if the cipherText can be decrypted
   * and the commitment is not void
   * assuming that the caller of addCommitment
   * has passed down the correct cipherStoreIndex, scope & commitmentHash
   */
  decryptCipher = (
    rawSaltPk: [bigint, bigint],
    rawCipherText: [bigint, bigint, bigint, bigint, bigint, bigint, bigint],
    commitmentHash: bigint,
    cipherStoreIndex: bigint
  ): Commitment | void => {
    try {
      const _commitment = RecoverCommitment(
        {
          _pKScalar: this.pKScalar,
          _nonce: this.nonce,
          _len: ConstCommitment.STD_TUPLE_SIZE,
          _saltPk: rawSaltPk as Point<bigint>,
          _cipher: rawCipherText.map((x) => BigInt(x)) as CipherText<bigint>
        },
        {
          _hash: commitmentHash
        }
      )

      if (_commitment) {
        const _tuple = _commitment.asTuple()
        const _secrets = this._knownSecrets.get(_tuple[1]) ?? []
        _secrets.push([_tuple[0], rawSaltPk[0], rawSaltPk[1], cipherStoreIndex])
        this._knownSecrets.set(_tuple[1], _secrets)

        return _commitment
      }
    } catch (e) {
      console.error(`Error decrypting cipherText: ${e}`)
      return
    }
  }

  /**
   * @dev recoverCommitments: Iterates through the knownSecrets map
   * and recovers the commitment at the given index
   * check if the commitment is not void and the nullRoot
   * is not present in the pool's rootSet
   */
  recoverCommitments = async (
    pool: OnChainPrivacyPool,
    ignoreNullified = true // if nullroot is present in pool rootSet, ignore it
  ): Promise<Commitment[]> => {
    const commitments: Commitment[] = []
    const _scope = await pool.scope()
    const _secrets = this._knownSecrets.get(_scope)
    let stateTree = pool.stateTree
    if (_secrets) {
      for (let i = 0; i < _secrets.length; i++) {
        const _tuple = [
          _secrets[i][0],
          _scope,
          this.secretK[0],
          this.secretK[1]
        ]
        // re-cover cipherText knowing the saltPk
        const _cipherText = poseidonEncrypt(
          _tuple,
          this.eK_FromSaltPk([_secrets[i][1], _secrets[i][2]]),
          this._nonce
        )
        // recover the commitment
        const _commitment = RecoverCommitment(
          {
            _pKScalar: this.pKScalar,
            _nonce: this.nonce,
            _len: ConstCommitment.STD_TUPLE_SIZE,
            _saltPk: [_secrets[i][1], _secrets[i][2]] as Point<bigint>,
            _cipher: _cipherText
          },
          {
            _tuple: _tuple,
            _secret: this.secretK
          }
        )
        if (_commitment) {
          // update commitment index

          try {
            _commitment.setIndex(stateTree)
          } catch (e) {
            console.error(e)
            continue
          }

          // if ignoreNullified == true
          // check existence of nullroot in pool rootSet
          // if exists then return undefined
          if (
            (ignoreNullified && !stateTree.has(_commitment.nullRoot)) ||
            !ignoreNullified
          ) {
            commitments.push(_commitment)
          }
        }
      }
    } else {
      // if no commitments were recovered
      // we'll create 2 void commitments
      for (let i = 0; i < 2; i++) {
        commitments.push(
          CreateNewCommitment({
            _pK: this.pKey,
            _nonce: this.nonce,
            _scope: _scope,
            _value: BigInt(0)
          })
        )
      }
    }
    return commitments
  }
}
