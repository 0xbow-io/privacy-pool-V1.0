
// circomlib import
include "comparators.circom";

//Local Imports
include "../domain/commitment.circom";

/**
A commitment is the binding of value to a domain (indentified by a scope value) 
& a cryptographic keypair. 

It is represented as a tuple: (value, scope, Secret.x, Secret.y)
Where secret is the ECDH shared secret key derived from 
the keypair's private & public key

Note:   The value must be a real number that is ≥ 0. 
        A commitment in which the value = 0, is considered a "void" commitment.
        
** stateRoot: 
    * Merkle root of Pool's state Tree (Lean IMT)
** actualTreeDepth: 
    * The current depth of the State Tree
** context: 
    * The context of the hash of transaction details & scope:
        ** keccak256(chainID, contractAddress, fee, feeCollector, units...) 
        ** mitigation against tampering of values after proof generation
** External: 
    * External existing/new input
** PrivateKey: 
    * Private keys with ownership of the existing/new commitments
** Nonce: 
    * Nonce values for the existing/new commitments
** CommitmentRoot: 
    * Commitment roots of the new/existing commitments:
        ** Compute Hash (commitmentHash) of the commitment tuple: 
            ** Poseidon(4)([value, scope, Secret.x, Secret.y])
        ** Construct Binary Merkle Tree with leave nodes being CipherText elements & Commitment Hash
        ** Compute the root of the tree ==> Commitment 
** NullRoot: 
    * Null roots of the existing/newcommitments
        ** Similary computed like the commitment root but leaf nodes are: 
            ** Keypair Public Key
            ** Keypair Secret Key
            ** Salt Public Key
            ** Encryption Key
        ** Functions as a nullifier to the commitRoot when inserted into the state tree. 
        ** Prevents replay attacks
        ** Private for the new commitments but public for the existing commitments 
** SaltPublicKey: 
    * EdDSA Public-key derived from the Salt generated for the new/existing commitments
        ** Salts are random values in the BabyJub Curve
** Ciphertext: 
    * Encrypted values of the new commitments
        ** Poseidon encryption with ECDH shared secret key derived from either:
            ** Salt & public key 
            ** Private key & Salt public key
            ** Assume Salt is unrecoverable, only Salt public key is known and public
** Index & Siblings: 
    ** Inclusion Merkle Proof of the commitmentRoot for existing commitments
    ** Verified against state root.
**/

template PrivacyPool(maxTreeDepth, nExisting, nNew) {
    /**** Public Signals ***/

    // Scope is the domain identifier 
    // i.e. Keccak256(chainID, contractAddress)
    signal input scope;
    // The depth of the State Tree
    // at which the merkleproofs 
    // were generated
    signal input actualTreeDepth;

    signal input context; 
    // external input values to existing commitments
    // external output values from new commitments
    signal input externIO[2];

    signal input existingStateRoot;
    signal input newSaltPublicKey[nNew][2]; 
    signal input newCiphertext[nNew][7];

    /**** End Of Public Signals ***/

    /**** Private Signals ***/

    signal input PrivateKey[nExisting+nNew];       
    signal input Nonce[nExisting+nNew];        
        
    signal input ExSaltPublicKey[nExisting][2];  
    signal input ExCiphertext[nExisting][7];    
    signal input ExIndex[nExisting];
    signal input ExSiblings[nExisting][maxTreeDepth];

    /**** End Of Private Signals ***/

    signal output newNullRoot[nExisting+nNew];
    signal output newCommitmentHash[nExisting+nNew];
    signal output newCommitmentRoot[nExisting+nNew];

    // ensure that External Input & Output
    // fits within the 252 bits
    var n2b1[2][252];
    n2b1[0] = Num2Bits(252)(externIO[0]);
    n2b2[1] = Num2Bits(252)(externIO[1]);


    // get ownership & membership proofs for existing commitments
    // and compute total sum
    signal totalEx[nExisting+1];
    totalEx[0] <== externIO[0];
    for (var i = 0; i < nExisting; i++) {
        var (value, nullRoot, commitmentRoot, hash) = CommitmentOwnershipProof()(scope, 
                                                                            privateKey[i], 
                                                                            ExSaltPublicKey[i], 
                                                                            Nonce[i], 
                                                                            ExCiphertext[i]
                                                                        );

        var computedStateRoot = CommitmentMembershipProof(maxTreeDepth)(actualTreeDepth, 
                                                                        commitmentRoot, 
                                                                        ExIndex[i], 
                                                                        ExSiblings[i]
                                                                    );
        
        // note that for a void commitment (that does not exist in the state tree)
        // it should have 0 value and a computed stateRoot of 0.
        // invalid ownership that yields 0 commitmentRoot might lead to 0 stateRoot
        // therefore best to confirm if value is 0 as well.

        var zeroValue = IsZero()(value);
        var zeroStateRoot = IsZero()(stateRoot);  
        var isVoid = IsZero()(zeroValue + zeroStateRoot, 0);             

        // if the calculated root does not match, we output the commitmentRoot & hash
        // unless the commitment is void.
        // this could reveal the linkage between prover & the commiment.
        // but still preserves the privacy of the commitment value.
        var eqStateRoot = IsEqual()([computedStateRoot, existingStateRoot]);  
        newCommitmentRoot[i] <== commitmentRoot * (1 - eqStateRoot) * (1 - isVoid); 
        newCommitmentHash[i] <== hash * (1 - eqStateRoot) * (1 - isVoid);

        // nullifier for the commitment         
        // if nullRoot allready exists in state Tree
        // then the transaction should be rejected
        newNullRoot[i] <== nullRoot;
        
        // we zero the value if eqStateRoot is 0    
        totalEx[i+1] <== totalEx[i] + value * (1 - eqStateRoot));
    }
    
    // get ownership for new commitments
    var k = nExisting; // offset for new commitments
    signal totalNew[nNew+1];
    totalNew[0] <== externIO[1];
    for (var i = 0; i < nNew; i++) {
        var (value, nullRoot, commitmentRoot, hash) = CommitmentOwnershipProof()(scope, 
                                                                            privateKey[k+i], 
                                                                            newSaltPublicKey[i], 
                                                                            Nonce[k+i], 
                                                                            newCiphertext[i]
                                                                    );
        // If invalid ownership, commitmentRoot is 0
        // Output nullRoot if commitmentRoot is 0
        // this nullifies the commitment
        // And forces prover to use the secret key 
        // derived from the keypair
        // and the correct scope value.
        var cRootZero = IsZero()(commitmentRoot);
        newNullRoot[k+i] <==  nullRoot * (1 - cRootZero);

        // don't stop the circuit if the commitmentRoot is invalid
        newCommitmentRoot[k+i] <== commitmentRoot;
        commitmentHash[k+i] <== hash;

        // reset value to 0 if commitmentRoot is invalid
        totalNew[i+1] <== totalNew[i] + (value * (1 - cRootZero));
    }

    // lastly ensure that all total sums are equal
    var equalSums <== IsEqual()([totalEx[nExisting], totalNew[nNew]]);
    equalSums === 1;

    // constraint on the context
    signal contextSqrd <== context * context; 
}

