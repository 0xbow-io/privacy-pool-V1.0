pragma circom 2.1.9;

// ZK Kit imports
include "safe-comparators.circom";

// PSE MACI imports
include "calculateTotal.circom";
include "hashers.circom";

/**
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

// Taken from @zk-kit/binary-merkle-root.circom
// If imported directly we get a conflic with poseidon import from circomlib
template ComputeMerkleRoot(MAX_DEPTH) {
    signal input leaf, depth, leafIndex, siblings[MAX_DEPTH];

    signal output out;

    signal nodes[MAX_DEPTH + 1];
    nodes[0] <== leaf;

    signal roots[MAX_DEPTH];
    var root = 0;

    // computation of leaf indices C-01
    var indices[MAX_DEPTH] = MerkleGeneratePathIndices(MAX_DEPTH)(leafIndex);

    for (var i = 0; i < MAX_DEPTH; i++) {
        var isDepth = IsEqual()([depth, i]);

        roots[i] <== isDepth * nodes[i];

        root += roots[i];

        var c[2][2] = [ [nodes[i], siblings[i]], [siblings[i], nodes[i]] ];
        var childNodes[2] = MultiMux1(2)(c, indices[i]);

        nodes[i + 1] <== PoseidonHasher(2)(childNodes);
    }

    var isDepth = IsEqual()([depth, MAX_DEPTH]);
    out <== root + isDepth * nodes[MAX_DEPTH];
}
