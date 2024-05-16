pragma circom 2.1.9;

include "./circomlib/poseidon.circom";
include "./circomlib/comparators.circom";
include "./keypair.circom";
include "./commitment.circom";
include "./nullifier.circom";
include "binary-merkle-root.circom";
include "./txRecordHash.circom";
include "./circomlib/switcher.circom";
include "./sign.circom";
include "./set.circom";

/** 
    AssociationProof Circuit iterates through nullifiers in reverse &
    recursively proves that the input nullifiers can be computed through a chain 
    of known commitments & txRecords that have membership in the associationSet
**/
template AssociationProof(MAX_DEPTH, nIns, nOuts) {

    /*
        Treat stepIn/stepOut as a stack ~ recursive proof as a stack machine. 
        --> step[0] --> computed pool comitment merkle root
        --> step[1] --> computed association merkle root
        --> step[2:2+nIns] --> current input nullifiers to be proven
        --> step[2+nIns:2+nIns+nIns] --> next queue of input nullifiers to be proven

        Example Steps:

        Step 0: 

                    Start Queue (in):                 Start Queue (out): 
                        [0,0]                  --->  [Nullifer[c], Nullifer[d]]
                            |
                            |
                            V
                        ToProve (in)
                    _ _ _ _ _ _ _ _ _
                    |                 |
                    |  Nullifier[a]   |  <---- OutCommitment[0] <----   <----  InNullifer[c][0]  <---- InCommitment[c][0], amount > 0
                    |                 |                             |  |
                    |                 |                         (***Pool***)
                    |                 |                             |  |
                    |  Nullifier[b]   |      |OutCommitment[1] <----    <----  InNullifer[d][1]  <---- InCommitment[d][1], amount > 0
                    |                 |
                    ----------------- 
                            |
                            |
                            V
                        ToProve
                    ToProve (out)                     
                    [0, Nullifier[b]]           



        Step 1: 

                    Start Queue (in):                  Start Queue (out): 
            [Nullifer[c], Nullifer[d]]         --->   [Nullifer[e], Nullifer[f]]
                            |
                            |
                            V
                        ToProve (in)
                    _ _ _ _ _ _ _ _ _
                    |                 |
                    |  0              |        OutCommitment[0] <----   <----  InNullifer[e][0]  <---- InCommitment[e][0], amount > 0
                    |                 |                             |  |
                    |                 |                         (***Pool***)
                    |                 |                             |  |
                    |  Nullifier[b]   |  <---- OutCommitment[1] <----    <----  InNullifer[f][1]  <---- InCommitment[f][1], amount > 0
                    |                 |
                    ----------------- 
                            |
                            |
                            V
                        ToProve
                    ToProve (out)                     
                    [Nullifer[c], Nullifer[d]]     



        Step 2: 

                    Start Queue (in):                  Start Queue (out): 
            [Nullifer[e], Nullifer[f]]         --->   [0,0]
                            |
                            |
                            V
                        ToProve (in)
                    _ _ _ _ _ _ _ _ _
                    |                 |
                    |  Nullifer[c]    |  <---- OutCommitment[0] <----   <----  InNullifer[g][0]  <---- InCommitment[g][0], amount == 0
                    |                 |                             |  |
                    |                 |                         (***Pool***)
                    |                 |                             |  |
                    |  Nullifer[d]    |  <---- OutCommitment[1] <----    <----  InNullifer[h][1]  <---- InCommitment[h][1], amount == 0
                    |                 |
                    ----------------- 
                            |
                            |
                            V
                        ToProve
                    ToProve (out)                     
                    [Nullifer[e], Nullifer[f]]    

        Step 3: 

                    Start Queue (in):                  Start Queue (out): 
                        [0,0]                  --->   [0,0]
                            |
                            |
                            V
                        ToProve (in)
                    _ _ _ _ _ _ _ _ _
                    |                 |
                    |  Nullifer[e]    |  <---- OutCommitment[0] <----   <----  InNullifer[g][0]  <---- InCommitment[e][0], amount == 0
                    |                 |                             |  |
                    |                 |                         (***Pool***)
                    |                 |                             |  |
                    |  Nullifer[f]    |  <---- OutCommitment[1] <----    <----  InNullifer[h][1]  <---- InCommitment[f][1], amount == 0
                    |                 |
                    ----------------- 
                            |
                            |
                            V
                        ToProve
                    ToProve (out)                     
                        [0,0] 

     
    */  

    signal input stepIn[nIns+nIns+2]; 
    signal output stepOut[nIns+nIns+2]; 

    // data to compute input nullifier
    signal input publicVal;

    signal input inUnits[nIns];
    signal input inPk[nIns][2];
    signal input inBlinding[nIns];
    signal input inLeafIndices[nIns];
    signal input inSigS[nIns];

    // data to compute output comitment
    signal input outUnits[nOuts];
    signal input outPk[nOuts][2];
    signal input outBlinding[nOuts];

    signal input commitmentProofLength;
    signal input commitmentProofIndices[nOuts][MAX_DEPTH];
    signal input commitmentProofSiblings[nOuts][MAX_DEPTH];

    // signatures for output nullifiers
    signal input outSigR8[nOuts][2];    
    signal input outSigS[nOuts];
    signal input outLeafIndices[nOuts];

    // tx record merkle proof
    signal input associationProofLength;
    signal input associationProofIndices[MAX_DEPTH];
    signal input associationProofSiblings[MAX_DEPTH];

    component outCommitments[nOuts];
    component outSigVerifier[nOuts];
    component outNullifiers[nOuts];

    /** 
        - Compute Output Commitments as usual (refer to Privacy Pool template) 
        - But add in extra step to compute the nullifiers of the output commitments
    **/
    signal outMerkleRoots[nOuts];
    var sumOuts = 0;
    for (var i = 0; i < nOuts; i++) {
        // compute output commitments
        outCommitments[i] = Commitment();
        outCommitments[i].amount <== outUnits[i];
        outCommitments[i].pubKey <== outPk[i];
        outCommitments[i].blinding <== outBlinding[i];

        // verify output signatures
        outSigVerifier[i] = VerifySignature();
        outSigVerifier[i].pubKey <== outPk[i];
        outSigVerifier[i].R8 <== outSigR8[i];
        outSigVerifier[i].S <== outSigS[i];
        outSigVerifier[i].commitment <== outCommitments[i].out;
        outSigVerifier[i].leafIndex <== outLeafIndices[i];   

        outSigVerifier[i].valid === 1;

        // compute output nullifer
        outNullifiers[i] = Nullifier();
        outNullifiers[i].commitment <== outCommitments[i].out;
        outNullifiers[i].leafIndex <== outLeafIndices[i];
        outNullifiers[i].signature <== outSigS[i];

        // compute pool commitment tree
        outMerkleRoots[i] <== BinaryMerkleRoot(MAX_DEPTH)(
                                                        outCommitments[i].out, 
                                                        commitmentProofLength, 
                                                        commitmentProofIndices[i], 
                                                        commitmentProofSiblings[i]
                                                        );
        sumOuts += outUnits[i];
    }

     // check that calculated merkle roots for each inputs match 
    for (var i = 0; i < nOuts - 1; i++) {
        outMerkleRoots[i] === outMerkleRoots[i+1];
    }

    // output commitment merkle root
    stepOut[0] <== outMerkleRoots[nOuts-1];

    // compute input nullifierss
    component inNullifier[nIns];
    component inCommitment[nIns];
    var sumIns = 0;
    for (var i = 0; i < nIns; i++) {
        // compute input commitments
        inCommitment[i] = Commitment();
        inCommitment[i].amount <== inUnits[i];
        inCommitment[i].pubKey <== inPk[i];
        inCommitment[i].blinding <== inBlinding[i];

        // verify input nullifier
        inNullifier[i] = Nullifier();
        inNullifier[i].commitment <== inCommitment[i].out;
        inNullifier[i].leafIndex <== inLeafIndices[i];
        inNullifier[i].signature <== inSigS[i];
        sumIns += inUnits[i];
    }

    // verify publicVal
    sumIns + publicVal === sumOuts;

    // Tx Record hash: 
    // Poseidon(
    //    Poseidon(
    //      inNullifier[0], 
    //      inNullifier[1]
    //    ), 
    //    Poseidon(
    //      outCommitment[0], 
    //      outCommitment[1]
    //    ), 
    //    publicVal, 
    //    outLeafIndex[0]
    //  )
    
    component txRecordHash;
    txRecordHash = GetTxRecordHash(nIns,nOuts);
    txRecordHash.inNullifiers[0] <== inNullifier[0].out;
    txRecordHash.inNullifiers[1] <== inNullifier[1].out;
    txRecordHash.outCommitments[0] <== outCommitments[0].out;
    txRecordHash.outCommitments[1] <== outCommitments[1].out;
    txRecordHash.publicVal <== publicVal;
    txRecordHash.leafIndex <== outLeafIndices[0];

    // compute tx record hash
    // calculate association merkle root from merkle proof
    component associationTreeMerkleRoot;
    associationTreeMerkleRoot = BinaryMerkleRoot(MAX_DEPTH);
    associationTreeMerkleRoot.leaf  <== txRecordHash.out;
    associationTreeMerkleRoot.depth <== associationProofLength;
    associationTreeMerkleRoot.indices <== associationProofIndices;
    associationTreeMerkleRoot.siblings <== associationProofSiblings;

    // only output calculated association root if amount is non-zero
    component isDeposit = IsPositive(248);
    isDeposit.in <== publicVal;

    component assMux1; 
    assMux1 = Mux1();
    assMux1.c[0] <== stepIn[1];
    assMux1.c[1] <== associationTreeMerkleRoot.out;
    assMux1.s <== isDeposit.result;
    assMux1.out ==> stepOut[1];  


    /**** prover will check if the input nullifiers have been proven ****/
    // check that the set of input nullifers to prove is not 0 
    // no steps should begin with 0 input nullifiers to prove 
    var sum = 0;
    for (var i = 0; i < nIns; i++) {
        sum += stepIn[i+2];        
    }
    component challengesEmtpy = IsZero();
    challengesEmtpy.in <== sum;

    challengesEmtpy.out === 0;

    // check if queue is empty
    // if queue is empty then we need to fill it with the current input nullifiers
    // otherwise in the case that we've proven all input nullifiers, we don't want to replace it with 0 values from the queue. 
    sum = 0;
    component replaceWith[nIns];
    for (var i = 0; i < nIns; i++) {
        sum = sum + stepIn[i+2+nIns]; // --> if empty, sum = 0

        replaceWith[i] = Mux1(); 
        replaceWith[i].c[0] <== inNullifier[i].out;
        replaceWith[i].c[1] <==  0; 
        replaceWith[i].s <== IsZero()(inUnits[i]); // if input amount is zero, replace with 0
        // set the values for the next queue as well
        replaceWith[i].out ==> stepOut[i+2+nIns];
    }

    component queueEmpty = IsZero();
    queueEmpty.in <== sum;
    

    // if empty, p = 0, we fill queue set of non-zero nullifers to be proven 
    component queueMux[nIns];
    for (var i = 0; i < nIns; i++) {
        queueMux[i] = Mux1(); 
        queueMux[i].c[0] <== stepIn[i+2+nIns];      // queue is not empty, assign current queued value
        queueMux[i].c[1] <== replaceWith[i].out;    // queue is empty, assign new value
        queueMux[i].s <== queueEmpty.out; 
    }

    // Check against current nullifiers if any have been proven. 
    component setMemberships[nIns];
    var proven = 0;
    for (var i = 0; i < nIns; i++) {
        setMemberships[i] = IsElementInSet(nOuts);
        setMemberships[i].element <== stepIn[i+2];
        for (var j = 0; j < nOuts; j++) {
            // fill set with computed output nullifiers
            setMemberships[i].set[j] <== outNullifiers[j].out;
        }
        // if nullifier is in set, then it has been proven
        // setMemberships[i].out = 1
        proven += setMemberships[i].out;
    }

    component allProven; 
    allProven = IsEqual();
    allProven.in[0] <== proven;
    allProven.in[1] <== nIns;

    // if product == 0, means all nullifiers have been proven
    // if so, then we set the next values to the queued values. 
    // otherwise, we keep the current values.
    component toProveMux[nIns];
    for (var i = 0; i < nIns; i++) {
        toProveMux[i] = Mux1(); 
        toProveMux[i].c[0] <== stepIn[i+2] - (stepIn[i+2] * setMemberships[i].out);    // not all proven --> 0 or old value
        toProveMux[i].c[1] <== queueMux[i].out;                                        // all proven --> replace with queued value
        toProveMux[i].s <== allProven.out; 
        toProveMux[i].out ==> stepOut[i+2]; 
    }

    // if this is the last step
    // stepOut[2:2+nIns] should be all 0 values
    // stepOut[2+nIns:2+nIns+nIns] should be all 0 values
    // improper linkage of nullifiers will result otherwise in leaking out unproven input nullifiers. 

    for (var i = 0; i < nIns+nIns+2; i++) {
       log(stepOut[i]);
    }
}