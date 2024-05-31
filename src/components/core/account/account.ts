import { generatePrivateKey, privateKeyToAccount, PrivateKeyAccount } from 'viem/accounts';
import { Hex, hexToBigInt } from 'viem';
import { numbers } from '@/store/variables';
import { CTX, BYTES_31, BYTES_62, GetCommitment, GetNullifier, NewCTX } from './ctx';
import { PrivacyPool } from '@core/pool';
import { downloadJSON } from '@/utils/files';

import {
  hash2,
  sign,
  Signature,
  genEcdhSharedKey,
  EcdhSharedKey,
  poseidonEncrypt,
  poseidonDecrypt,
  Ciphertext,
} from 'maci-crypto';
import { Keypair, PrivKey, PubKey } from 'maci-domainobjs';

/*
    Ethereum ESDCA keypairs can be used to
    compute Privacy Pool CTXs.
    A "Public key" PK is generated from the private key
    Secrets are encrypted with encryption public key derived from private key
*/

export type privacyKeys = {
  pk: Hex; // ecdsa private key
  pubAddr: Hex; // ecdsa public address

  keypair: Keypair; // eddsa keypair (from maci-domainobjs)
  eK: EcdhSharedKey; // ECDH shared key
};

export interface Account {
  genKeyPair(exportToJSON: boolean): Keypair;
  importPrivKey(privateKey: Hex): Keypair;
  ExportToJSON(download: boolean): string;
  LoadFromJSON(data: string): void;
  encryptCTX(utxo: CTX): Ciphertext;
  decryptCTX(ciphertext: Ciphertext, utxo: CTX): { amount: bigint; blinding: bigint };
  GetPrivacyKeys(): privacyKeys[];
}

export type PoolCTXs = {
  Pool: PrivacyPool;
  NullifierToCommitments: Map<bigint, bigint>; // map of nullifiers to commitment hashes
  commitmentToCTXs: Map<bigint, CTX>; // map of commitment hashes to CTXs
};

// UI Friendly types
export type PrivacyKeyUI = {
  Address: string;
  PrivateKey: string;
  pK: string;
  Pk: string;
  eK: string[];
  noOfCtx: number;
};

export class account implements Account {
  keypairs: Map<bigint, privacyKeys>; // map of hash(pk) to keypair
  esdcaAccounts: Map<string, PrivateKeyAccount>; // map of pub to account
  poolIDCTXMap: Map<string, PoolCTXs>; // mapping of poolID to poolCTXMap

  public constructor() {
    this.keypairs = new Map<bigint, privacyKeys>();
    this.esdcaAccounts = new Map<string, PrivateKeyAccount>();
    this.poolIDCTXMap = new Map<string, PoolCTXs>();
  }

  public genKeyPair(exportToJSON: boolean): Keypair {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    // Derive a eddsa public key from the private key.
    // pack it for convenience
    const pK = new PrivKey(hexToBigInt(privateKey));
    const keypair = new Keypair(pK);
    const pubKeyHash = keypair.pubKey.hash();

    this.esdcaAccounts.set(account.address, account);
    this.keypairs.set(pubKeyHash, {
      pubAddr: account.address,
      pk: privateKey,
      keypair: keypair,
      eK: genEcdhSharedKey(keypair.privKey.rawPrivKey, keypair.pubKey.rawPubKey),
    });
    if (exportToJSON) {
      this.ExportToJSON(true);
    }
    return keypair;
  }

  public importPrivKey(privateKey: Hex): Keypair {
    const account = privateKeyToAccount(privateKey);
    this.esdcaAccounts.set(account.address, account);

    // Derive a eddsa public key from the private key.
    // pack it for convenience
    const pK = new PrivKey(hexToBigInt(privateKey));
    const keypair = new Keypair(pK);
    const pubKeyHash = keypair.pubKey.hash();

    this.keypairs.set(pubKeyHash, {
      pubAddr: account.address,
      pk: privateKey,
      keypair: keypair,
      eK: genEcdhSharedKey(keypair.privKey.rawPrivKey, keypair.pubKey.rawPubKey),
    });
    return keypair;
  }

  // given a pubkey hash, return the associated private key as string
  public pKFromPk(Pk: PubKey): string {
    let keys = this.keypairs.get(Pk.hash()) as privacyKeys;
    return keys.keypair.privKey.rawPrivKey.toString();
  }

  // given a pubkey hash, return the associated private key as bigint
  public pKFromPkBigInt(Pk: PubKey): bigint {
    let keys = this.keypairs.get(Pk.hash()) as privacyKeys;
    return keys.keypair.privKey.rawPrivKey as bigint;
  }

  // given a pubkey hash, return the associated encryption public key
  public eKFromPk(Pk: PubKey): EcdhSharedKey {
    let keys = this.keypairs.get(Pk.hash()) as privacyKeys;
    return keys.eK;
  }

  public privateKeyFromPk(Pk: PubKey): Hex {
    let keys = this.keypairs.get(Pk.hash()) as privacyKeys;
    return keys.pk;
  }

  public pubAddressFromPkHash(PkHash: bigint): Hex {
    let keys = this.keypairs.get(PkHash) as privacyKeys;
    return keys.pubAddr;
  }

  public hasKeyPair(PkHash: bigint): boolean {
    return this.keypairs.has(PkHash);
  }
  public keypairFromPkHash(PkHash: bigint): Keypair {
    let keys = this.keypairs.get(PkHash) as privacyKeys;
    return keys.keypair;
  }

  public encryptCTX(utxo: CTX): Ciphertext {
    const sharedKey = this.eKFromPk(utxo.Pk);
    // using utxo index as a nonce
    return poseidonEncrypt([utxo.amount, utxo.blinding], sharedKey, utxo.index);
  }

  // attempts to decrypt the encryptedOutput of a commitment event
  // reveals which private key was used to encrypt the CTX
  public decryptCTX(ciphertext: Ciphertext, utxo: CTX): { amount: bigint; blinding: bigint } {
    const sharedKey = this.eKFromPk(utxo.Pk);
    const plainText = poseidonDecrypt(ciphertext, sharedKey, utxo.index, 2);
    return { amount: plainText[0], blinding: plainText[1] };
  }

  // generates a signature for a CTX
  // with pk associated with CTX Pk
  public signCTX(utxo: CTX): Signature {
    return sign(this.pKFromPk(utxo.Pk), hash2([GetCommitment(utxo), utxo.index]));
  }

  public ExportToJSON(download: boolean): string {
    let json = JSON.stringify({
      privateKeys: Array.from(this.keypairs.values()).map((keys) => {
        return {
          pk: keys.pk,
          pubAddr: keys.pubAddr,
          keypair: keys.keypair.toJSON(),
          ek_x: '0x' + keys.eK[0].toString(16),
          ek_y: '0x' + keys.eK[1].toString(16),
        };
      }),
    });
    if (download) {
      downloadJSON(json, 'privacy_pool_keys.json');
    }
    return json;
  }

  public LoadFromJSON(data: string) {
    const jsonObj = JSON.parse(data);
    jsonObj.privateKeys.forEach((keys: any) => {
      let keypair = Keypair.fromJSON(keys.keypair);
      this.keypairs.set(keypair.pubKey.hash(), {
        pk: keys.pk,
        pubAddr: keys.pubAddr,
        keypair: keypair,
        eK: [hexToBigInt(keys.ek_x), hexToBigInt(keys.ek_y)],
      });
    });
  }

  public GetPubKeys(): string[] {
    return Array.from(this.keypairs.values()).map((keys) =>
      keys.keypair.pubKey.hash().toString(16),
    );
  }

  public GetPrivacyKeys(): privacyKeys[] {
    return Array.from(this.keypairs.values()).map((keys) => keys);
  }

  // used to retrieve CTX from commitment events
  // verifies against the commitment if the CTX is valid
  // otherwise returns CTX, commitment, nullifier, and bool
  recoverCTX(
    Pk: PubKey,
    decryptedOutput: string,
    commitment: bigint,
    index: bigint,
  ): { utxo: CTX; commitment: bigint; nullifier: bigint; ismatch: boolean } {
    const buf = Buffer.from(decryptedOutput, 'base64');
    let amountBuffer = ('0x' + buf.subarray(numbers.ZERO, BYTES_31).toString('hex')) as Hex;
    let blindingBuffer = ('0x' + buf.subarray(BYTES_31, BYTES_62).toString('hex')) as Hex;

    let utxo: CTX = {
      amount: hexToBigInt(amountBuffer),
      blinding: hexToBigInt(blindingBuffer),
      Pk: Pk,
      index: index,
    };
    let utxoCommitment = GetCommitment(utxo);
    return {
      utxo: utxo,
      commitment: utxoCommitment,
      nullifier: GetNullifier(utxo, this.signCTX(utxo)),
      ismatch: utxoCommitment == commitment,
    };
  }

  // Tries to fetch CTX from history
  // If doesn't exist, create a virvual CTX if a pubkey is given
  public FetchCTX(
    poolID: string,
    ctxHash: bigint,
    SuggestedPk: PubKey,
    SuggestedIndex: bigint,
  ): CTX {
    let ctx = this.poolIDCTXMap.get(poolID)?.commitmentToCTXs.get(ctxHash);
    if (ctx) {
      return ctx;
    } else {
      return NewCTX(SuggestedPk, 0n, SuggestedIndex);
    }
  }

  // iterates through the known CTXs for a pool and counts the number of CTXs
  // where the CTX's Pk matches the given Pk
  public CTXCountForPk(poolID: string, Pk: bigint): number {
    let count = 0;
    this.poolIDCTXMap.get(poolID)?.commitmentToCTXs.forEach((ctx) => {
      if (ctx.Pk.hash() == Pk) {
        count++;
      }
    });
    return count;
  }

  // Used to render on UI all the Keys the Account own
  public KeyList(poolID: string): PrivacyKeyUI[] {
    console.log('KeyList :', this.keypairs.values());
    let uiKeys = Array.from(this.keypairs.values()).map((keys) => {
      return {
        Address: keys.pubAddr.toString(),
        PrivateKey: keys.pk.toString(),
        pK: keys.keypair.privKey.serialize(),
        Pk: keys.keypair.pubKey.serialize(),
        eK: keys.eK.map((x) => x.toString(16)),
        noOfCtx: this.CTXCountForPk(poolID, keys.keypair.pubKey.hash()),
      } as PrivacyKeyUI;
    });
    return uiKeys;
  }
}

/*

       // iterates through owned private keys
    // and find the private key that is associated with the commitment event
    // if there's a match, store the commitment as a CTX
    public StoreCommitmentIfMatch(chain: Chain, contract: Address, commitment: Commitment) {
        this.keypairs.forEach((keys, Pk) => {
            const {isDecrypted, decrypted} = this.decryptCTX(commitment.encryptedOutput, keys.keypair.pubKey)
            if (isDecrypted) {
                let {utxo, commitment: utxoCommitment, nullifier, ismatch}
                    = this.recoverCTX(keys.keypair.pubKey, decrypted, hexToBigInt(commitment.commitment as Hex), commitment.index)
                if (ismatch) {
                    try {
                        this.chainCTXMap.get(chain)?.get(contract)?.NullifierToCommitments.set(nullifier, utxoCommitment)
                        this.chainCTXMap.get(chain)?.get(contract)?.commitmentToCTXs.set(utxoCommitment, utxo)
                    } catch (error) {
                        return false
                    }
                }
            }
        })
    }


    public SyncWithChains(chains: Chain[]){
        this.chainCTXMap = new Map<Chain, poolCTXMap>(
            chains.map((chain: Chain) => {
                return [
                    chain, new Map<Address, PoolCTXs>(
                    PrivacyPools.get(chain)?.map((pool: PrivacyPool) => {
                        // init state for pool
                        pool.state = new stateManager(chain, pool.pool)
                        pool.state.SyncFrom(pool.genesis, 10000, this.StoreCommitmentIfMatch)
                        return [
                                    pool.pool,
                                    {
                                        Pool: pool,
                                        NullifierToCommitments: new Map<bigint, bigint>(),
                                        commitmentToCTXs: new Map<bigint, CTX>()
                                    }
                                ]
                            })
                        )
                    ]
                })
            )

    }

*/
