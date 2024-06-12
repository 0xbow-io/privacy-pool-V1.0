pragma solidity ^0.8.4;

import "./library/PoseidonT3.sol";

contract TreeHasher {
    function hash(uint256[2] calldata input) external pure returns (uint256) {
        return PoseidonT3.hash(input);
    }
}
