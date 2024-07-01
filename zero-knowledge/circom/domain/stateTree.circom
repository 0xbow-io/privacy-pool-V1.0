// zk-kit imports
include "safe-comparators.circom";
// MACI imports
include "hashers.circom";

// Verifies a inclusion proof generated for a lean merkle-tree
template LeanIMTInclusionProof(levels) {

    /*
    public static verifyProof(proof: IMTMerkleProof, hash: IMTHashFunction): boolean {
        requireObject(proof, "proof")
        requireTypes(proof.root, "proof.root", ["number", "string", "bigint"])
        requireTypes(proof.leaf, "proof.leaf", ["number", "string", "bigint"])
        requireArray(proof.siblings, "proof.siblings")
        requireArray(proof.pathIndices, "proof.pathIndices")

        let node = proof.leaf

        for (let i = 0; i < proof.siblings.length; i += 1) {
            const children = proof.siblings[i].slice()

            children.splice(proof.pathIndices[i], 0, node)

            node = hash(children)
        }

        return proof.root === node
    }

    */
}


/**
 Taken from MACI:
 https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/trees/incrementalMerkleTree.circom
 Due to invalid version from npm. 
 * Verifies the correct construction of a Merkle tree from a set of leaves.
 * Given a Merkle root and a list of leaves, check if the root is the
 * correct result of inserting all the leaves into the tree (in the given order).
 */
template CheckRoot(levels) {
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
