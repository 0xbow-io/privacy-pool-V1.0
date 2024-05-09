// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IVerifier {
    function verifyProof(uint256[] memory _proof, uint256[] memory _input, uint8 _inputLen)
        external
        view
        returns (bool);
}
