pragma circom 2.1.9;

// ciromlib imports
include "mux1.circom";
// zk-kit imports
include "safe-comparators.circom";
// MACI imports
include "calculateTotal.circom";
include "hashers.circom";

/**

    Taken from MACI:
    https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/trees/incrementalMerkleTree.circom
    When pulled from NPM, this template is missing..

 * Calculates the path indices required for Merkle proof verifications.
 * Given a node index within an IMT and the total tree levels, it outputs the path indices leading to that node.
 * The template handles the modulo and division operations to break down the tree index into its constituent path indices.
 
 */
template MerkleGeneratePathIndices(levels) {
    var BASE = 2;

    signal input in;
    signal output out[levels];

    var m = in;
    var computedResults[levels];

    for (var i = 0; i < levels; i++) {
        // circom's best practices suggests to avoid using <-- unless you
        // are aware of what's going on. This is the only way to do modulo operation.
        out[i] <-- m % BASE;
        m = m \ BASE;

        // Check that each output element is less than the base.
        var computedIsOutputElementLessThanBase = SafeLessThan(3)([out[i], BASE]);
        computedIsOutputElementLessThanBase === 1;

        // Re-compute the total sum.
        computedResults[i] = out[i] * (BASE ** i);
    }

    // Check that the total sum matches the index.
    var computedCalculateTotal = CalculateTotal(levels)(computedResults);

    computedCalculateTotal === in;
}

/***
    Verify Proof for Lean Incremental Tree (@zk-kit) based on MACI's implementation
    Taken from https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/trees/incrementalMerkleTree.circom
    Ts version: https://github.com/privacy-scaling-explorations/zk-kit/blob/main/packages/lean-imt/src/lean-imt.ts#L293C1-L317C6
***/
template LeanIMTInclusionProof(maxDepth) {
    signal input leaf, leafIndex, siblings[maxDepth], actualDepth;
    signal output out;

    // Convert leafIndex to bits
    var indices[maxDepth] = MerkleGeneratePathIndices(maxDepth)(leafIndex);

    signal nodes[maxDepth + 1];
    signal roots[maxDepth];
    
    // let node = leaf
    nodes[0] <== leaf; 
    
    var root = 0;
    // for (let i = 0; i < siblings.length; i += 1)
    for (var i = 0; i < maxDepth; i++) {
        var isDepth = IsEqual()([actualDepth, i]);

        roots[i] <== isDepth * nodes[i];
        root += roots[i];

        //node = ((index >> i) & 1) ?  hash(siblings[i], node) : hash(node, siblings[i]);
        var c[2][2] = [ [nodes[i], siblings[i]], [siblings[i], nodes[i]] ];
        var childNodes[2] = MultiMux1(2)(c, indices[i]);
        nodes[i + 1] <== PoseidonHasher(2)(childNodes);
    }

    var isDepth = IsEqual()([actualDepth, maxDepth]);
    out <== root + isDepth * nodes[maxDepth];
}


/***
    Taken from MACI:
    https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/trees/incrementalMerkleTree.circom
    Version from NPM has a bug in this line: [computedLevelHashers[i] = PoseidonHasher(2)([computedLevelHashers[k*2], computedLevelHashers[k*2+1]]);]  
    Instead of computedLevelHashers, its Hashers...

    * Constructs a binary merkle tree with a given number of levels.
    * Returns the Merkle Root of the tree.
***/
template ComputeTreeRoot(levels) {
    // The total number of leaves in the Merkle tree, calculated as 2 to the power of `levels`.
    var totalLeaves = 2 ** levels;
    // The number of first-level hashers needed, equal to half the total leaves, as each hasher combines two leaves.
    var numLeafHashers = totalLeaves / 2;
    // The number of intermediate hashers, one less than the number of leaf hashers,
    // as each level of hashing reduces the number of hash elements by about half.
    var numIntermediateHashers = numLeafHashers - 1;

    // Array of leaf values input to the circuit.
    signal input leaves[totalLeaves];

    // Output signal for the Merkle root that results from hashing all the input leaves.
    signal output root;

    // Total number of hashers used in constructing the tree, one less than the total number of leaves,
    // since each level of the tree combines two elements into one.
    var numHashers = totalLeaves - 1;
    var computedLevelHashers[numHashers];

    // Initialize hashers for the leaves, each taking two adjacent leaves as inputs.
    for (var i = 0; i < numLeafHashers; i++){
        computedLevelHashers[i] = PoseidonHasher(2)([leaves[i*2], leaves[i*2+1]]);
    }

    // Initialize hashers for intermediate levels, each taking the outputs of two hashers from the previous level.
    var k = 0;
    for (var i = numLeafHashers; i < numLeafHashers + numIntermediateHashers; i++) {
        computedLevelHashers[i] = PoseidonHasher(2)([computedLevelHashers[k*2], computedLevelHashers[k*2+1]]);
        k++;
    }

    // Connect the output of the final hasher in the array to the root output signal.
    root <== computedLevelHashers[numHashers-1];
}
