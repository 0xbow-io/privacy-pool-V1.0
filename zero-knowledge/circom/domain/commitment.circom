pragma circom 2.1.9;

// circomlib import
include "mux1.circom";
// zk-kit imports
include "ecdh.circom";
include "poseidon-cipher.circom";
// MACI imports
include "privToPubkey.circom";
include "hashers.circom";
//Local Imports
include "./stateTree.circom";


/** Context:
Privacy Pool store arbitary values without ever revealing it.
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

/** Context:
Valid recovery / generation of commitment tuple requires a keypair proving ownership:
    * Given a private-key (pK), nonce value, Salt public-key (saltPk) & ciphertext, prove:
        - (1) That ECDH ecryption key (Ek) can be recovered from pK & saltPk.
        - (2) Ek & nonce can decrypt the ciphertext to reveal a commitment tuple: (value, scope, secretKey.x, secretKey.y)
        - (3) commitment tuple contains same ECDH shared secret key from the prover's keypair.

(note): 
Because the Salt value is not known, 
when recovering a prior commitment it's possible that another Salt wil be used to re-encrypt the commitment tuple.
If so the Salt publickey & ciphertext hash will differ but ownership proof still holds. 
This should still invalidate membership proofs. 
Hence, a commmitment root is calculated by constructing a merkle-tree with the ciphertext elements and the commitment hash.
This root is then inserted into the Pool's state tree.
**/
template CommitmentOwnershipProof(){
    signal input privateKey; // EdDSA private key
    signal input nonce;     // nonce value for Poseidon decryption

    // used to derive the encryptionKey
    signal input saltPublicKey[2]; 
    signal input ciphertext[7];

    // recovered commitment fields
    signal output scope; 
    signal output value; 
    signal output nullRoot;
    signal output commitmentRoot;
    signal output commitmentHash;

    // compute public key & shared secret key
    var publicKey[2] = PrivToPubKey()(privateKey);
    var secretKey[2] = Ecdh()(privateKey, publicKey);

    // compute encryption key 
    var encryptionKey[2] = Ecdh()(privateKey, saltPublicKey);

    // Decrypt the message using Poseidon decryption.
    // should contain [value, scope, SecretK_x, SecretK_y]
    var recoveredTuple[7] = PoseidonDecryptWithoutCheck(4)(
        [
            ciphertext[0], ciphertext[1], 
            ciphertext[2], ciphertext[3],
            ciphertext[4], ciphertext[5], 
            ciphertext[6]
        ],
        nonce, 
        encryptionKey
    );

    // Check that the decrypted message contains the correct SecretK
    recoveredTuple[2] === secretKey[0];
    recoveredTuple[3] === secretKey[1];  

    // output decrypted commitment fields
    value <== recoveredTuple[0];
    scope <== recoveredTuple[1];

    // compute the hash of the commitment tuple
    var commitmentHash = PoseidonHasher(4)([
        value, scope, secretKey[0], secretKey[1]
    ]);
    commitmentHash <== commitmentHash;

    // compute commitment root
    // we will use 3 levels which holds 8 leaves 
    // this fits all ciphertext elements + commitmentHash
    var computedRoot = CheckRoot(3)([
        ciphertext[0], ciphertext[1], 
        ciphertext[2], ciphertext[3],
        ciphertext[4], ciphertext[5], 
        ciphertext[6], commitmentHash
    ]);
    commitmentRoot <== computedRoot;

    // null root is the computed root of all keys
    // that was used to encrpt / decrypt the ciphertext
    // this acts somewhat liek a nullifier to the computedRoot
    // unlike the computedRoot, whcih can be verified externally to the circuit 
    // as all elements are public, the nullRoot contains only private elements aside
    // from the saltPublicKey which is public.
    // Nevertheless all elements are somewhat derived from the private key
    // so a false nullRoot would invalidate the computedTrueRoots
    // membership proof (different cipherText hash or commitment hash)
    var computedNullRoot = CheckRoot(3)([
        publicKey[0], publicKey[1], 
        secretKey[0], secretKey[1],
        saltPublicKey[0], saltPublicKey[1], 
        encryptionKey[0], encryptionKey[1]
    ]);
    nullRoot <== computedNullRoot;
}



/** Context:
Commitments in a domain must hold sufficient membership.
    * Privacy Pool V1 mantains a lean incremental merkle tree structure from @zk-kit for efficient hashing. 
    * The leaf node is the computed root of all ciphertext elemeents and the commitment hash. 
        - see: CommitmentOwnershipProof
    * Compute the merkle-root from the LeanIMT inclusion proof & the commitment root.
    * Correct merkle-root implies that there exists in the Pool's state a ciphertext 
        that can be decrypted to reveal a preserved value. 
**/
template CommitmentMembershipProof(treeDepth){
    signal input commitmentRoot;
    signal input index;
    signal input stateRoot; 
    signal input siblings[treeDepth];
    signal input actualTreeDepth;
    var computedMerkleRoot = MerkleTreeInclusionProof(treeDepth)(
        commitmentRoot,
        actualTreeDepth,
        index,
        siblings
    );
    stateRoot === computedMerkleRoot;   
}
