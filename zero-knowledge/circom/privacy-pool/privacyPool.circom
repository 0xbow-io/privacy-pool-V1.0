
//Local Imports
include "../domain/commitment.circom";


template PrivacyPool(maxTreeDepth, nIn, nOut) {
    //** Public Inputs **//
    signal input scope;
    signal input stateRoot;
    signal input actualTreeDepth;

    signal input commitFlag; // either 1 or 0
    signal input publicVal;
    
    signal input newNullRoot[nIn];
    signal input newCommitmentRoot[nOut];
    signal input newSaltPublicKey[nOut][2]; 
    signal input newCiphertext[nOut][7];

    //** Public Inputs **//
    signal input privateKey[nIn+nOut]; 
    signal input nonce[nIn+nOut];     
    signal input oldCommitmentRoot[nOut];
    signal input outSaltPublicKey[nOut][2]; 
    signal input oldCiphertext[nIn][7];
    signal input oldIndex[nIn];
    signal input oldSiblings[nIn][treeDepth];

    signal output commitmentHash[nOut];

    component OwernshipProver[nIn+nOut];
    component MembershipProver[nIn];

    var _inputSum = 0;
    var k = 0;
    for (var i = 0; i < nIn; i++) {
        // prove ownership of an old cipherText
        OwernshipProver[i] = CommitmentOwnershipProof();    
        OwernshipProver[i].privateKey <== privateKey[i];
        OwernshipProver[i].nonce <== nonce[i];
        OwernshipProver[i].saltPublicKey[0] <== outSaltPublicKey[i][0];
        OwernshipProver[i].saltPublicKey[1] <== outSaltPublicKey[i][1];
        OwernshipProver[i].ciphertext <== oldCiphertext[i];
        // verify scope
        OwernshipProver[i].scope === scope;
        // verify nullRoots 
        OwernshipProver[i].nullRoot === newNullRoot[i];

        var isDummyIpnut = IsZero()(OwernshipProver.value);

        MembershipProver[i] = CommitmentMembershipProof(maxTreeDepth);
        MembershipProver[i].index <== oldCommitmentRoot;
        MembershipProver[i].stateRoot <== stateRoot;
        MembershipProver[i].siblings <== oldIndex[i];
        MembershipProver[i].actualTreeDepth <== actualTreeDepth;

        // check if value is less than 252
        component valCheck = Num2Bits(252);
        valCheck.in <== OwernshipProver[i].value;

        _inputSum += OwernshipProver[i].value;
    }

    // Sum all outputs
    var _outputSum = 0;
    for (var i = nIn; i < nIn+nOut; i++) {
    
        // prove ownership of an old cipherText
        OwernshipProver[i] = CommitmentOwnershipProof();
        OwernshipProver[i].privateKey <== privateKey[i];
        OwernshipProver[i].nonce <== nonce[i];
        OwernshipProver[i].saltPublicKey[0] <== newSaltPublicKey[i][0];
        OwernshipProver[i].saltPublicKey[1] <== newSaltPublicKey[i][1];
        OwernshipProver[i].ciphertext <== newCiphertext[i];
        // verify scope
        OwernshipProver[i].scope === scope;
        // verify the new commitmentRoot 
        OwernshipProver[i].commitmentRoot === newCommitmentRoot[i];
        commitmentHash <== OwernshipProver[i].commitmentHash;

        component valCheck = Num2Bits(252);
        valCheck.in <== OwernshipProver[i].value;
        _outputSum += OwernshipProver[i].value;
    }

    // verify publicval
    // if commitFlag = 0, a release was requested
    // therefore input is deducted by publicVal
    component expectedOutputSum = Mux1();
    expectedOutputSum.c[0] <== _inputSum + publicVal;
    expectedOutputSum.c[1] <== _inputSum - publicVal;
    expectedOutputSum.s <== IsZero()(commitFlag);
    expectedOutputSum.out === _outputSum;
}