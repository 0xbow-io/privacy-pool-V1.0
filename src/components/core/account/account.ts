
import { generatePrivateKey, privateKeyToAccount, PrivateKeyAccount } from 'viem/accounts'
import  {Hex, hexToBigInt} from 'viem'
import { numbers } from '@/store/variables'
import { toFixedHex, toBuffer} from '@/utils/hash'
import { encrypt, decrypt, getEncryptionPublicKey } from 'eth-sig-util'
import { packEncryptedMessage, unpackEncryptedMessage } from '@/utils/encrypt'
import {CTX, BYTES_31,BYTES_62, GetCommitment, GetNullifier} from './ctx'
import {Commitment, PrivacyPool, PrivacyPools, stateManager} from '@core/pool'
import { Chain } from 'viem/chains';
import { Address } from 'viem'

import { hash2, hash3, sign, Signature, genEcdhSharedKey, EcdhSharedKey, poseidonEncrypt, poseidonDecrypt, Ciphertext} from "maci-crypto"
import { LeanIMT } from "@zk-kit/imt"
import {Keypair, PrivKey, PubKey} from "maci-domainobjs"



/*
    Ethereum ESDCA keypairs can be used to 
    compute Privacy Pool CTXs. 
    A "Public key" PK is generated from the private key
    Secrets are encrypted with encryption public key derived from private key
*/

export type privacyKeys = {
    pk:  Hex            // ecdsa private key
    pubAddr: Hex        // ecdsa public address

    keypair: Keypair    // eddsa keypair (from maci-domainobjs)
    eK:  EcdhSharedKey  // ECDH shared key
}

export interface Account {
    genKeyPair(): Keypair 
    importKeyPair(privateKey: Hex): void
    encryptCTX(utxo: CTX): Ciphertext
    decryptCTX(ciphertext: Ciphertext, utxo: CTX): {amount: bigint, blinding: bigint}
    StoreCommitmentIfMatch(chain: Chain, contract: Address, commitment: Commitment): void
}

export type PoolCTXs = {
    Pool: PrivacyPool
    NullifierToCommitments: Map<bigint, bigint>  // map of nullifiers to commitments
    commitmentToCTXs: Map<bigint, CTX> // map of commitments to CTX
}

export type poolCTXMap = Map<Address, PoolCTXs>

export class account implements Account {
    keypairs: Map<bigint, privacyKeys> // map of hash(pk) to keypair
    esdcaAccounts: Map<string, PrivateKeyAccount> // map of pub to account
    chainCTXMap: Map<Chain, poolCTXMap> // CTX mapping to chain & pool contract
    
    public constructor(){
        this.keypairs = new Map<bigint, privacyKeys>()  
        this.esdcaAccounts = new Map<string, PrivateKeyAccount>()
        this.chainCTXMap = new Map<Chain, poolCTXMap>()
    }
    

    public genKeyPair(): Keypair {
        const privateKey = generatePrivateKey()
        const account = privateKeyToAccount(privateKey)

        // Derive a eddsa public key from the private key.
        // pack it for convenience
        const pK = new PrivKey(hexToBigInt(privateKey))
        const keypair = new Keypair(pK)
        const pubKeyHash = keypair.pubKey.hash()

        this.esdcaAccounts.set(account.address, account)
        this.keypairs.set(pubKeyHash, {
            pubAddr: account.address,
            pk: privateKey,
            keypair: keypair,
            eK: genEcdhSharedKey(keypair.privKey.rawPrivKey, keypair.pubKey.rawPubKey)
        })   
        return keypair
    }

    public importKeyPair(privateKey: Hex){
        const account = privateKeyToAccount(privateKey)
        this.esdcaAccounts.set(account.address, account)

        // Derive a eddsa public key from the private key.
        // pack it for convenience
        const pK = new PrivKey(hexToBigInt(privateKey))
        const keypair = new Keypair(pK)
        const pubKeyHash = keypair.pubKey.hash()

        this.keypairs.set(pubKeyHash, {
            pubAddr: account.address,
            pk: privateKey,
            keypair: keypair,
            eK: genEcdhSharedKey(keypair.privKey.rawPrivKey, keypair.pubKey.rawPubKey)
        })   
    }

    // given a pubkey hash, return the associated private key as string
    public pKFromPk(Pk: PubKey): string {
        let keys = this.keypairs.get(Pk.hash()) as privacyKeys
        return keys.keypair.privKey.rawPrivKey.toString()
    }

    // given a pubkey hash, return the associated private key as bigint
    public pKFromPkBigInt(Pk: PubKey): bigint {
        let keys = this.keypairs.get(Pk.hash()) as privacyKeys
        return keys.keypair.privKey.rawPrivKey as bigint
    }

    // given a pubkey hash, return the associated encryption public key
    public eKFromPk(Pk: PubKey): EcdhSharedKey {
        let keys = this.keypairs.get(Pk.hash()) as privacyKeys
        return keys.eK
    }

    public privateKeyFromPk(Pk: PubKey): Hex {
        let keys = this.keypairs.get(Pk.hash()) as privacyKeys
        return keys.pk
    }

    
    public encryptCTX(utxo: CTX): Ciphertext {
        const sharedKey = this.eKFromPk(utxo.Pk)
        // using utxo index as a nonce
        return poseidonEncrypt( [utxo.amount, utxo.blinding], sharedKey, utxo.index)
    }

    // attempts to decrypt the encryptedOutput of a commitment event
    // reveals which private key was used to encrypt the CTX
    public decryptCTX(ciphertext: Ciphertext, utxo: CTX): {amount: bigint, blinding: bigint} {
        const sharedKey = this.eKFromPk(utxo.Pk)
        const plainText = poseidonDecrypt(ciphertext, sharedKey, utxo.index, 2)
        return {amount: plainText[0], blinding: plainText[1]}

    }

    // generates a signature for a CTX
    // with pk associated with CTX Pk
    public signCTX(utxo: CTX): Signature {
        return sign(this.pKFromPk(utxo.Pk), hash2([GetCommitment(utxo), utxo.index]));
    }

    public ExportToJSON(): string {
        return JSON.stringify({
            keypairs: this.keypairs
        })
    }

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



    // used to retrieve CTX from commitment events
    // verifies against the commitment if the CTX is valid
    // otherwise returns CTX, commitment, nullifier, and bool
    recoverCTX( Pk: PubKey, decryptedOutput: string, commitment: bigint, index: bigint): 
        { utxo: CTX, commitment: bigint, nullifier: bigint, ismatch: boolean } 
    {
        const buf =  Buffer.from(decryptedOutput, 'base64')
        let amountBuffer = "0x" + buf.subarray(numbers.ZERO, BYTES_31).toString('hex') as Hex
        let blindingBuffer = "0x" + buf.subarray(BYTES_31, BYTES_62).toString('hex') as Hex

        let utxo : CTX = {
            amount: hexToBigInt(amountBuffer),
            blinding: hexToBigInt(blindingBuffer),
            Pk: Pk,
            index: index
        }
        let utxoCommitment = GetCommitment(utxo)
        return {utxo: utxo, commitment: utxoCommitment, nullifier: GetNullifier(utxo, this.signCTX(utxo)), ismatch: utxoCommitment == commitment}
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
}
