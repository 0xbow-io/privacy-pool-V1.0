
import { generatePrivateKey, privateKeyToAccount, PrivateKeyAccount } from 'viem/accounts'
import  {Hex,fromHex} from 'viem'
import { numbers } from '@/store/variables'
import { toFixedHex, toBuffer} from '@/utils/hash'
import { encrypt, decrypt, getEncryptionPublicKey } from 'eth-sig-util'
import { packEncryptedMessage, unpackEncryptedMessage } from '@/utils/encrypt'
import {UTXO, BYTES_31,BYTES_62, GetCommitment, GetNullifier} from '@core/utxo'
import {Commitment, PrivacyPool, PrivacyPools, stateManager} from '@core/pool'
import { Chain } from 'viem/chains';
import { Address } from 'viem'

import { poseidon3 } from "poseidon-lite/poseidon3"
import { LeanIMT } from "@zk-kit/imt"



import {
    derivePublicKey,
    signMessage,
    verifySignature,
    deriveSecretScalar,
    packPublicKey,
    unpackPublicKey
} from "@zk-kit/eddsa-poseidon"

/*
    Ethereum ESDCA keypairs can be used to 
    compute Privacy Pool UTXOs. 
    A "Public key" PK is generated from the private key
    Secrets are encrypted with encryption public key derived from private key
*/

export type keypair = {
    pub: Hex         // ecdsa public address
    pk:  Hex         // ecdsa private key
    Pk:  bigint      // packed public key derived from pk via Baby Jubjub elliptic curve  https://eips.ethereum.org/EIPS/eip-2494
    eK:  string      // x25519-xsalsa20-poly1305 encryption public key
}

export interface Account {
    genKeyPair(): bigint 
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
    keypairs: Map<bigint, keypair> // map of pk to keypair
    esdcaAccounts: Map<string, PrivateKeyAccount> // map of pub to account
    chainUTXOMap: Map<Chain, poolUTXOMap> // UTXO mapping to chain & pool contract
    
    public constructor(){
        this.keypairs = new Map<bigint, keypair>()  
        this.esdcaAccounts = new Map<string, PrivateKeyAccount>()
        this.chainUTXOMap = new Map<Chain, poolUTXOMap>()
    }
    

    public genKeyPair(): bigint {
        const privateKey = generatePrivateKey()
        const account = privateKeyToAccount(privateKey)

        // Derive a eddsa public key from the ecdsa private key.
        // pack it for convenience
        const Pk = packPublicKey(derivePublicKey(privateKey))

        this.esdcaAccounts.set(account.address, account)
        this.keypairs.set(Pk, {
            pub: account.address,
            pk: privateKey,
            Pk: Pk,
            eK: getEncryptionPublicKey(privateKey.slice(numbers.OX_LENGTH))
        })   
        return Pk
    }

    public importKeyPair(privateKey: Hex){
        const account = privateKeyToAccount(privateKey)
        this.esdcaAccounts.set(account.address, account)

        // Derive a public key from the private key.
        const Pk = packPublicKey(derivePublicKey(privateKey))

        this.keypairs.set(Pk, {
            pub: account.address,
            pk: privateKey,
            Pk: Pk,
            eK: getEncryptionPublicKey(privateKey.slice(numbers.OX_LENGTH))
        })   
    }

    // given a packed public key, return the associated private key
    public pKFromPk(Pk: bigint): Hex {
        let keypair = this.keypairs.get(Pk) as keypair
        return keypair.pk
    }

    public pKFromPkBigInt(Pk: bigint): bigint {
        let keypair = this.keypairs.get(Pk) as keypair
        return fromHex(keypair.pk, 'bigint')
    }

    // given a packed public key, return the associated encryption public key
    eKFromPk(Pk: bigint): string {
        let keypair = this.keypairs.get(Pk) as keypair
        return keypair.eK
    }


    // iterates through owned private keys
    // and find the private key that is associated with the commitment event
    // if there's a match, store the commitment as a UTXO
    public StoreCommitmentIfMatch(chain: Chain, contract: Address, commitment: Commitment) {
        this.keypairs.forEach((keypair, Pk) => {
            const {isDecrypted, decrypted} = this.decryptUTXO(commitment.encryptedOutput, Pk)
            if (isDecrypted) {
                let {utxo, commitment: utxoCommitment, nullifier, ismatch} 
                    = this.recoverUTXO(Pk, decrypted, fromHex(commitment.commitment as Hex, 'bigint'), commitment.index)
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
    decryptUTXO(encryptedOutput: string, Pk: bigint): {isDecrypted: boolean, decrypted: string} {
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
    recoverUTXO( Pk: bigint, decryptedOutput: string, commitment: bigint, index: bigint): 
        { utxo: UTXO, commitment: bigint, nullifier: bigint, ismatch: boolean } 
    {
        const buf =  Buffer.from(decryptedOutput, 'base64')
        let amountBuffer = "0x" + buf.subarray(numbers.ZERO, BYTES_31).toString('hex') as Hex
        let blindingBuffer = "0x" + buf.subarray(BYTES_31, BYTES_62).toString('hex') as Hex

        let utxo : UTXO = {
            amount: fromHex(amountBuffer, "bigint"),
            blinding: fromHex(blindingBuffer, "bigint"),
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
    public signUTXO(utxo: UTXO): bigint {
        return poseidon3([this.pKFromPkBigInt(utxo.Pk), GetCommitment(utxo), utxo.index])
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
