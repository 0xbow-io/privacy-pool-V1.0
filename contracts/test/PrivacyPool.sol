// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/PrivacyPool.sol";
import "../src/verifier/groth16_verifier.sol";

/***
 * @title TestPrivacyPool
 * @notice TestPrivacyPool contract is used to test the core
 * A mock verifier is used to avoid requiring a proof to be generated
 * per test case.
 ***/
contract TestPrivacyPool is Test {
    Groth16Verifier internal verifier;
    PrivacyPool internal pool;

    function setUp() public {
        verifier = new Groth16Verifier();
        pool = new PrivacyPool(
            0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, // native primitive
            address(verifier)
        );
    }
    /*
        function MockVerifier(
            uint256 MerkleRoot,
            uint256 publicVal,
            uint256 scope,
            uint256[2] memory InputNullifiers,
            uint256[2] memory OutputCommitments,
            bool _expectedOut
        ) public {
            // mock call to verifier contract
            // to make testing of process function easily
            vm.mockCall(
                address(verifier),
                abi.encodeWithSelector(
                    verifier.verifyProof.selector,
                    dummy_pa,
                    dummy_pb,
                    dummy_pc,
                    [
                        pool.Scope(), // scope
                        publicVal, // actualTreeDepth
                        scope,
                        32,
                        InputNullifiers[0],
                        InputNullifiers[1],
                        OutputCommitments[0],
                        OutputCommitments[1]
                    ]
                ),
                abi.encode(_expectedOut)
            );
        }
    */
}
