pragma circom 2.1.8;

include "./circomlib/poseidon.circom";
include "./keypair.circom";
include "./commitment.circom";
include "./nullifier.circom";
include "binary-merkle-root.circom";


template PrivacyPool(MAX_DEPTH, nIns, nOuts) {

    signal input publicVal;
    signal input signalHash;
    signal input merkleProofLength;

    // data for nIns Nullifiers
    signal input inputNullifier[nIns];
    signal input inUnits[nIns];
    signal input inPk[nIns][2];
    signal input inBlinding[nIns];

    // input signature components 
    signal input inSigR8[nIns][2];    
    signal input inSigS[nIns];

    signal input inLeafIndices[nIns];
    signal input merkleProofIndices[nIns][MAX_DEPTH];
    signal input merkleProofSiblings[nIns][MAX_DEPTH];

    // data for nOuts Commitments
    signal input outCommitment[nOuts];
    signal input outUnits[nOuts];
    signal input outPk[nOuts][2];
    signal input outBlinding[nOuts];

    signal output merkleRoot;

    component inKeypair[nIns];
    component inCommitment[nIns];
    component inSigVerifier[nIns];
    component inNullifier[nIns];
    component inMux1[nIns];

    // verify correctness of inputs
    signal inMerkleRoots[nIns];
    var sumIns = 0;
    for (var i = 0; i < nIns; i++) {
        inCommitment[i] = Commitment();
        inCommitment[i].amount <== inUnits[i];
        inCommitment[i].pubKey <== inPk[i];
        inCommitment[i].blinding <== inBlinding[i];

         // verify signature from private key
        inSigVerifier[i] = VerifySignature();
        inSigVerifier[i].pubKey <== inPk[i];
        inSigVerifier[i].R8 <== inSigR8[i];
        inSigVerifier[i].S <== inSigS[i];
        inSigVerifier[i].commitment <== inCommitment[i].out;
        inSigVerifier[i].leafIndex <== inLeafIndices[i];   

        inSigVerifier[i].valid === 1;
       
        inNullifier[i] = Nullifier();
        inNullifier[i].commitment <== inCommitment[i].out;
        inNullifier[i].leafIndex <== inLeafIndices[i];
        inNullifier[i].signature <== inSigS[i];

        inNullifier[i].out === inputNullifier[i];

        // insert new root if amount is non-zero
        // otherwise insert previous root
        inMux1[i] = Mux1();
        inMux1[i].c[0] <== BinaryMerkleRoot(MAX_DEPTH)(
                                                        inCommitment[i].out, 
                                                        merkleProofLength, 
                                                        merkleProofIndices[i], 
                                                        merkleProofSiblings[i]
                                                        );
        inMux1[i].c[1] <== i == 0 ? 0 : inMerkleRoots[i-1];

        inMux1[i].s <== IsZero()(inUnits[i]);
        inMux1[i].out ==> inMerkleRoots[i]; 
        sumIns += inUnits[i];
    }

    // check that calculated merkle roots match 
    for (var i = 0; i < nIns - 1; i++) {
        inMerkleRoots[i] === inMerkleRoots[i+1];
    }
    merkleRoot <== inMerkleRoots[nIns-1];

    component expectedOutCommitment[nOuts];
    component outUnitsCheck[nOuts];
    var sumOuts = 0;

    // verify correctness of outputs
    for (var i = 0; i < nOuts; i++) {
        expectedOutCommitment[i] = Commitment();
        expectedOutCommitment[i].amount <== outUnits[i];
        expectedOutCommitment[i].pubKey <== outPk[i];
        expectedOutCommitment[i].blinding <== outBlinding[i];

        expectedOutCommitment[i].out === outCommitment[i];

        // Check that amount fits into 248 bits to prevent overflow
        outUnitsCheck[i] = Num2Bits(248);
        outUnitsCheck[i].in <== outUnits[i];

        sumOuts += outUnits[i];
    }

    // check that there are no same nullifiers among all inputs
    component sameNullifiers[nIns * (nIns - 1) / 2];
    var index = 0;
    for (var i = 0; i < nIns - 1; i++) {
      for (var j = i + 1; j < nIns; j++) {
          sameNullifiers[index] = IsEqual();
          sameNullifiers[index].in[0] <== inNullifier[i].out;
          sameNullifiers[index].in[1] <== inNullifier[j].out;
          sameNullifiers[index].out === 0;
          index++;
      }
    }
    sumIns + publicVal === sumOuts;
    signal signalSquare <== signalHash * signalHash;
}