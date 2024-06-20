pragma circom 2.1.9;

// circomlib imports
include "comparators.circom";

template IsElementInSet(length) {
    signal input element;
    signal input set[length];
    signal output out;


    signal diffs[length];
    signal product[length + 1];
    product[0] <== 1;


    for (var i = 0; i < length; i++) {
    diffs[i] <== set[i] - element;
    product[i + 1] <== product[i] * diffs[i];
    }

    IsZero()(product[length]) ==> out;
}
