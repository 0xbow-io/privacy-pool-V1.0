pragma circom 2.1.9;

// Returns 1 if the sign of the value is positive, and 0 if it is negative. If the value is 0, prover can output either of these. Only works for absolute values < 2^n; throws otherwise.
template IsPositive(n) {
    assert(n <= 252); // The component is not sound for n > 252
    signal input in;
    signal output result;

    signal out[n];
    signal to_rangecheck;

    result <-- (in > 0);
    result === result*result; // constrain to be a bit
    to_rangecheck <== (2*result - 1)*in;

    var lc1=0;
    var e2=1;
    for (var i = 0; i<n; i++) {
        out[i] <-- (to_rangecheck >> i) & 1;
        out[i] * (out[i] -1 ) === 0;
        lc1 += out[i] * e2;
        e2 = e2+e2;
    }

    lc1 === to_rangecheck;
}