
import { generatePrivateKey, privateKeyToAccount, PrivateKeyAccount } from 'viem/accounts'
import  {Hex, hexToBigInt} from 'viem'
import { numbers } from '@/store/variables'
import { toFixedHex, toBuffer} from '@/utils/hash'
import { encrypt, decrypt, getEncryptionPublicKey } from 'eth-sig-util'
import { packEncryptedMessage, unpackEncryptedMessage } from '@/utils/encrypt'
import {UTXO, BYTES_31,BYTES_62, GetCommitment, GetNullifier} from '@core/utxo'
import {Commitment, PrivacyPool, PrivacyPools, stateManager} from '@core/pool'
import { Chain } from 'viem/chains';
import { Address } from 'viem'

import { hash2, hash3, sign, Signature} from "maci-crypto"
import { LeanIMT } from "@zk-kit/imt"
import {Keypair, PrivKey, PubKey} from "maci-domainobjs"



/*
    Ethereum ESDCA keypairs can be used to 
    compute Privacy Pool UTXOs. 
    A "Public key" PK is generated from the private key
    Secrets are encrypted with encryption public key derived from private key
*/

export type privacyKeys = {
    pk:  Hex         // ecdsa private key
    pubAddr: Hex     // ecdsa public address

    keypair: Keypair // eddsa keypair (from maci-domainobjs)
    eK:  string      // x25519-xsalsa20-poly1305 encryption public key
}

export interface Account {
    genKeyPair(): Keypair 
    importKeyPair(privateKey: Hex): void
    encryptUTXO(utxo: UTXO): string
    StoreCommitmentIfMatch(chain: Chain, contract: Address, commitment: Commitment): void
}

export type PoolUTXOs = {
    Pool: PrivacyPool
    NullifierToCommitments: Map<bigint, bigint>  // map of nullifiers to commitments
    commitmentToUTXOs: Map<bigint, UTXO> // map of commitments to UTXO
}

export type poolUTXOMap = Map<Address, PoolUTXOs>

export class account implements Account {
    keypairs: Map<bigint, privacyKeys> // map of hash(pk) to keypair
    esdcaAccounts: Map<string, PrivateKeyAccount> // map of pub to account
    chainUTXOMap: Map<Chain, poolUTXOMap> // UTXO mapping to chain & pool contract
    
    public constructor(){
        this.keypairs = new Map<bigint, privacyKeys>()  
        this.esdcaAccounts = new Map<string, PrivateKeyAccount>()
        this.chainUTXOMap = new Map<Chain, poolUTXOMap>()
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
            eK: getEncryptionPublicKey(privateKey.slice(numbers.OX_LENGTH))
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
            eK: getEncryptionPublicKey(privateKey.slice(numbers.OX_LENGTH))
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
    public eKFromPk(Pk: PubKey): string {
        let keys = this.keypairs.get(Pk.hash()) as privacyKeys
        return keys.eK
    }

    public privateKeyFromPk(Pk: PubKey): Hex {
        let keys = this.keypairs.get(Pk.hash()) as privacyKeys
        return keys.pk
    }


    // iterates through owned private keys
    // and find the private key that is associated with the commitment event
    // if there's a match, store the commitment as a UTXO
    public StoreCommitmentIfMatch(chain: Chain, contract: Address, commitment: Commitment) {
        this.keypairs.forEach((keys, Pk) => {
            const {isDecrypted, decrypted} = this.decryptUTXO(commitment.encryptedOutput, keys.keypair.pubKey)
            if (isDecrypted) {
                let {utxo, commitment: utxoCommitment, nullifier, ismatch} 
                    = this.recoverUTXO(keys.keypair.pubKey, decrypted, hexToBigInt(commitment.commitment as Hex), commitment.index)
                if (ismatch) {
                    try {
                        this.chainUTXOMap.get(chain)?.get(contract)?.NullifierToCommitments.set(nullifier, utxoCommitment)
                        this.chainUTXOMap.get(chain)?.get(contract)?.commitmentToUTXOs.set(utxoCommitment, utxo)
                    } catch (error) {
                        return false
                    }
                }
            }
        })
    }


    // attempts to decrypt the encryptedOutput of a commitment event
    // reveals which private key was used to encrypt the UTXO
    decryptUTXO(encryptedOutput: string, Pk: PubKey): {isDecrypted: boolean, decrypted: string} {
        try {
            let encrypted = unpackEncryptedMessage(encryptedOutput)
            let decrypted = decrypt(encrypted, this.pKFromPk(Pk).slice(numbers.OX_LENGTH))
            return {isDecrypted: true, decrypted: decrypted}
        } catch (error) {
            return {isDecrypted: false,decrypted: ""}
        }
    }

    // used to retrieve UTXO from commitment events
    // verifies against the commitment if the UTXO is valid
    // otherwise returns UTXO, commitment, nullifier, and bool
    recoverUTXO( Pk: PubKey, decryptedOutput: string, commitment: bigint, index: bigint): 
        { utxo: UTXO, commitment: bigint, nullifier: bigint, ismatch: boolean } 
    {
        const buf =  Buffer.from(decryptedOutput, 'base64')
        let amountBuffer = "0x" + buf.subarray(numbers.ZERO, BYTES_31).toString('hex') as Hex
        let blindingBuffer = "0x" + buf.subarray(BYTES_31, BYTES_62).toString('hex') as Hex

        let utxo : UTXO = {
            amount: hexToBigInt(amountBuffer),
            blinding: hexToBigInt(blindingBuffer),
            Pk: Pk,
            index: index
        }
        let utxoCommitment = GetCommitment(utxo)
        return {utxo: utxo, commitment: utxoCommitment, nullifier: GetNullifier(utxo, this.signUTXO(utxo)), ismatch: utxoCommitment == commitment}
    }

    public encryptUTXO(utxo: UTXO): string {
        const bytes = Buffer.concat([toBuffer(utxo.amount, BYTES_31), toBuffer(utxo.blinding, BYTES_31)])
        let encrypted = encrypt(
                    this.eKFromPk(utxo.Pk),
                    {
                        data: bytes.toString('base64'),
                    },
                    'x25519-xsalsa20-poly1305'
                )
        return packEncryptedMessage(encrypted)
    }

    // generates a signature for a UTXO
    // with pk associated with UTXO Pk
    public signUTXO(utxo: UTXO): Signature {
        return sign(this.pKFromPk(utxo.Pk), hash2([GetCommitment(utxo), utxo.index]));
    }

    public ExportToJSON(): string {
        return JSON.stringify({
            keypairs: this.keypairs
        })
    }

    public SyncWithChains(chains: Chain[]){
        this.chainUTXOMap = new Map<Chain, poolUTXOMap>(
            chains.map((chain: Chain) => {
                return [
                    chain, new Map<Address, PoolUTXOs>(
                    PrivacyPools.get(chain)?.map((pool: PrivacyPool) => {
                        // init state for pool
                        pool.state = new stateManager(chain, pool.pool)
                        pool.state.SyncFrom(pool.genesis, 10000, this.StoreCommitmentIfMatch)
                        return [
                                    pool.pool, 
                                    {
                                        Pool: pool,
                                        NullifierToCommitments: new Map<bigint, bigint>(),
                                        commitmentToUTXOs: new Map<bigint, UTXO>()
                                    }
                                ]
                            })
                        )
                    ]
                })
            ) 

    }
}
