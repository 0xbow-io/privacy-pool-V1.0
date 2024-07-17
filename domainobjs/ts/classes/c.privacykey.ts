import type { Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon";
import type { Point } from "@zk-kit/baby-jubjub";
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub";
import type { Commitment } from "@privacy-pool-v1/domainobjs";
import type { OnChainPrivacyPool } from "@privacy-pool-v1/contracts";
import {
	RecoverCommitment,
	ConstCommitment,
} from "@privacy-pool-v1/domainobjs";
import type { CipherText } from "@zk-kit/poseidon-cipher";
import { poseidonDecrypt, poseidonEncrypt } from "@zk-kit/poseidon-cipher";

export type PrivacyKeys = PrivacyKey[];

export class PrivacyKey {
	_nonce: bigint;
	_pkScalar: bigint;
	_secret: Point<bigint>;

	// Mapping of Scope to
	// Minimum required elements that can
	// recover a commitment & it's nullRoot and commitmentRoot
	// --> scope: (value, saltPk, idx)[]
	// where idx is the index in the Pool's CipherStore
	// note: we do not care about void commitments
	_knownSecrets: Map<bigint, [bigint, bigint, bigint, bigint][]> = new Map();

	constructor(privateKey: Hex, nonce = 0n) {
		this._nonce = nonce;
		this._pkScalar = deriveSecretScalar(privateKey);
		this._secret = mulPointEscalar(this.Pk, this.pKScalar);
	}

	static generate = (nonce: bigint): PrivacyKey => {
		return new PrivacyKey(generatePrivateKey(), nonce);
	};

	static from = (key: Hex, nonce: bigint): PrivacyKey => {
		return new PrivacyKey(key, nonce);
	};

	get pKScalar(): bigint {
		return this._pkScalar;
	}

	get nonce(): bigint {
		return this._nonce;
	}

	get Pk(): Point<bigint> {
		return mulPointEscalar(Base8, this.pKScalar);
	}

	get secretK(): Point<bigint> {
		return this._secret;
	}

	eK_FromSaltPk = (saltPk: Point<bigint>): Point<bigint> =>
		mulPointEscalar(saltPk, this.pKScalar);

	/**
	 * Add a commitment to the knownSecrets map
	 * only if the cipherText can be decrypted
	 * and the commitment is not void
	 * assuming that the caller of addCommitment
	 * has passed down the correct cipherStoreIndex, scope & commitmentHash
	 */
	decryptCipher = async (
		rawSaltPk: [bigint, bigint],
		rawCipherText: [bigint, bigint, bigint, bigint, bigint, bigint, bigint],
		commitmentHash: bigint,
		cipherStoreIndex: bigint,
	): Promise<void> => {
		let _commitment: Commitment | undefined;
		try {
			_commitment = RecoverCommitment(
				{
					_pKScalar: this.pKScalar,
					_nonce: this.nonce,
					_len: ConstCommitment.STD_TUPLE_SIZE,
					_saltPk: rawSaltPk as Point<bigint>,
					_cipher: rawCipherText.map((x) => BigInt(x)) as CipherText<bigint>,
				},
				{
					_hash: commitmentHash,
				},
			) as Commitment;
		} catch (e) {
			console.error(`Error decrypting cipherText: ${e}`);
		}

		if (!_commitment) {
			return;
		}

		if (_commitment.isVoid()) {
			return;
		}
		const _tuple = _commitment.asTuple();
		const _secrets = this._knownSecrets.get(_tuple[1]) ?? [];
		_secrets.push([_tuple[0], rawSaltPk[0], rawSaltPk[1], cipherStoreIndex]);
		this._knownSecrets.set(_tuple[1], _secrets);
		return;
	};

	/**
	 * @dev recoverCommitments: Iterates through the knownSecrets map
	 * and recovers the commitment at the given index
	 * check if the commitment is not void and the nullRoot
	 * is not present in the pool's rootSet
	 */
	recoverCommitments = async (
		pool: OnChainPrivacyPool,
		ignoreNullified = true, // if nullroot is present in pool rootSet, ignore it
	): Promise<Commitment[]> => {
		const commitments: Commitment[] = [];
		const _scope = await pool.scope();
		const _secrets = this._knownSecrets.get(_scope);
		if (_secrets) {
			for (let i = 0; i < _secrets.length; i++) {
				const _tuple = [
					_secrets[i][0],
					_scope,
					this.secretK[0],
					this.secretK[1],
				];
				// re-cover cipherText knowing the saltPk
				const _cipherText = poseidonEncrypt(
					_tuple,
					this.eK_FromSaltPk([_secrets[i][1], _secrets[i][2]]),
					this._nonce,
				);
				// recover the commitment
				const _commitment = RecoverCommitment(
					{
						_pKScalar: this.pKScalar,
						_nonce: this.nonce,
						_len: ConstCommitment.STD_TUPLE_SIZE,
						_saltPk: [_secrets[i][1], _secrets[i][2]] as Point<bigint>,
						_cipher: _cipherText,
					},
					{
						_tuple: _tuple,
						_secret: this.secretK,
					},
				);
				if (_commitment) {
					// update commitment index

					try {
						_commitment.setIndex(pool.merkleTree);
					} catch (e) {
						console.error(e);
						continue;
					}

					// if ignoreNullified == true
					// check existence of nullroot in pool rootSet
					// if exists then return undefined
					if (
						(ignoreNullified && !pool.rootSet.has(_commitment.nullRoot)) ||
						!ignoreNullified
					) {
						commitments.push(_commitment);
					}
				}
			}
		}
		return commitments;
	};
}
