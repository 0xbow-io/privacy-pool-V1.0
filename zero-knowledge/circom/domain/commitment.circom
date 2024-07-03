pragma circom 2.1.9;

// circomlib import
include "mux1.circom";
include "comparators.circom";
include "gates.circom";
// zk-kit imports
include "ecdh.circom";
include "poseidon-cipher.circom";
// MACI imports
include "privToPubkey.circom";
include "hashers.circom";
//Local Imports
include "./stateTree.circom";

/** Context: Privacy Pool store arbitary values without ever revealing it.
To achieve privacy-preservation, a value (i.e. 10 atoms) needs to exist within some domain & must be owned by some keypair: 
    - Domain: A structured set where all set elements holds verifiable membership proof (i.e. leaves of a Merkle Tree).
        * will be referenced through the Scope value.
        * A Privacy Pool is a domain.
    - keypair: Set of cryptographic keys (i.e. private & public keys) that:
        * is responsible for encrypting the value
        * can prove ownership via a secret (unique to the keypair) within the encrypted ciphertext.

The binding results in the "commitment" tuple: (value, scope, secretKey.x, secretKey.y)
The tuple is encrypted with an encryption key which is derived from the keypair & a Salt (random BabyJub value).
    * ECDH shared secret key with:
        - Salt & Keypair public-key
        - Salt public-key & Keypair private-key
A hash is generated for both encrypted & non-encrypted "commitment" tuple (commitment hash, cipherText hash) 
and is then bundled together with the Salt public-key & ciphertext to be committed to Privacy Pool.
**/

/** Context: Valid recovery / generation of commitment tuple requires a keypair proving ownership

* Given a private-key (pK), nonce value, Salt public-key (saltPk) & ciphertext, prove:
- (1) That ECDH ecryption key (Ek) can be recovered from pK & saltPk.
- (2) Ek & nonce can decrypt the ciphertext to reveal a commitment tuple: (value, scope, secretKey.x, secretKey.y)
- (3) commitment tuple contains same ECDH shared secret key from the prover's keypair.

(note): 
Because the Salt value is not known (& assumed unrecoverable), 
when recovering a prior commitment it's possible that another Salt wil be used to re-encrypt the commitment tuple.
If so the Salt publickey & ciphertext hash will differ but ownership proof still holds. 
This should still invalidate membership proofs. 

Hence, a commmitment root is calculated by constructing a merkle-tree with the ciphertext elements and the commitment hash.
This root is then inserted into the Pool's state tree.
Re-encrypting a receoverd commitment will then invalidate the membership proof as the commitmentRoot will differ. 
**/

template RecoverCommitmentKeys(){
    signal input privateKey;         // EdDSA private key
    signal input saltPublicKey[2];  // used to derive the encryptionKey

    signal output publicKey[2];
    signal output secretKey[2];
    signal output encryptionKey[2];     

    // compute public key & shared secret key & encryption key
    var computedPublicKey[2] = PrivToPubKey()(privateKey);

    publicKey <== computedPublicKey;
    secretKey <== Ecdh()(privateKey, computedPublicKey);
    encryptionKey <== Ecdh()(privateKey, saltPublicKey);
}

template DecryptCommitment(cipherLen, tupleLen){
    signal input encryptionKey[2];               // ecdh shared secret key                                
    signal input nonce;                         // nonce value for Poseidon decryption
    signal input ciphertext[cipherLen];        // encrypted commitment tuple

    signal output tuple[tupleLen];
    signal output hash; 

    var decryptor[cipherLen] = PoseidonDecryptWithoutCheck(tupleLen)(
        [
            ciphertext[0], ciphertext[1], ciphertext[2], ciphertext[3],
            ciphertext[4], ciphertext[5], ciphertext[6]
        ],
        nonce,
        encryptionKey
    );

    var recovered[tupleLen];
    for (var i = 0; i < tupleLen; i++) {
        recovered[i] = decryptor[i];
    }
    tuple <== recovered;
    hash <== PoseidonHasher(tupleLen)(recovered);
}

/** 
    Prove ownership of commitment by recovering the tuple from the ciphertext and
    verifying the contents of tuple. 
    Then output the hash of the tuple.
**/
template CommitmentOwnershipProof(){
    var CIPHER_LEN = 7;
    var TUPLE_LEN = 4;

    signal input scope;
    signal input privateKey;                // EdDSA private key
    signal input saltPublicKey[2];          // used to derive the encryptionKey
    signal input nonce;                     // nonce value used for Poseidon decryption
    signal input ciphertext[CIPHER_LEN];    // encrypted commitment tuple

    signal output value;
    signal output nullRoot;
    signal output commitmentRoot;
    signal output commitmentHash;

    //  [publicKey, secretKey, encryptionKey]
    var (publicKey[2], secretKey[2], encryptionKey[2]) = RecoverCommitmentKeys()(privateKey,saltPublicKey);

    // null root is the computed root of all secrets/keys
    // that were involved with the commitment.
    // As it only contains private elements (aside
    // from the saltPublicKey which is public).
    // It's utilised as a nullifier to the commitmentRoot.
    nullRoot <== CheckRoot(3)(
        [ 
            publicKey[0], publicKey[1], 
            secretKey[0], secretKey[1],
            saltPublicKey[0], saltPublicKey[1], 
            encryptionKey[0], encryptionKey[1]
        ]);

    //  [value, scope, secret.x, secret.y]
    var (tuple[TUPLE_LEN], hash) = DecryptCommitment(CIPHER_LEN,TUPLE_LEN)(encryptionKey, nonce, ciphertext);
    value <== tuple[0];
    commitmentHash <== hash; 

    // Verify contents and
    // Compute commitment root
    // CommitmentRoot can be verified outside of the circuit
    // as ciphertext & commitmenthash are public values.
    var (eqScope, eqSecret_x, eqSecret_y, computedCommitmentRoot) = ( 
                    IsEqual()([scope, tuple[1]]),   
                    IsEqual()([secretKey[0], tuple[2]]),
                    IsEqual()([secretKey[1], tuple[3]]),
                    CheckRoot(3)(
                        [  
                            ciphertext[0], ciphertext[1], 
                            ciphertext[2], ciphertext[3],
                            ciphertext[4], ciphertext[5], 
                            ciphertext[6], hash
                        ]
                    )
    );
    // invalidate the root if ownership is invalid
    // necessary to invalidate membership proofs
    var isValid = IsEqual()([eqScope + eqSecret_x + eqSecret_y, 3]);
    commitmentRoot <== computedCommitmentRoot * isValid; 
}

/** Context: 
    Privacy Pool V1 mantains a lean incremental merkle tree structure from @zk-kit for efficient hashing. 
    The leaf nodes are the commitmentRoot of the commitments.
        * see: CommitmentOwnershipProof
    Compute the stateRoot given the inclusion merkle proof for the commitmentRoot
    Correct merkle-root proves existence of the commitment, and the avaiability of a 
    ciphertext that can be decrypted to reveal the commitment tuple.
**/
template CommitmentMembershipProof(maxTreeDepth){
    signal input actualTreeDepth;
    signal input commitmentRoot;
    signal input index;
    signal input siblings[maxTreeDepth];

    signal output stateRoot; 
    var root = MerkleTreeInclusionProof(maxTreeDepth)(
        commitmentRoot,
        actualTreeDepth,
        index,
        siblings
    );
    stateRoot <== root;
}