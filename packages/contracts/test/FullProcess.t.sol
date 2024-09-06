// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "forge-std/StdJson.sol";

import "../src/verifier/groth16_verifier.sol";
import "../src/interfaces/IPrivacyPool.sol";
import "../src/interfaces/IVerifier.sol";
import "../src/PrivacyPool.sol";
import "../src/Constants.sol";

/**
 * @title TestFullProcess
 * @dev Tests the full process of the PrivacyPool contract over multiple rounds
 */
contract TestFullProcess is Test {
    Groth16Verifier internal verifier;
    PrivacyPool internal pool;

    function setUp() public {
        verifier = new Groth16Verifier();
        pool = new PrivacyPool(D_BASE_FIELD_INTERPRETER, address(verifier));
    }

    struct FFIArgs {
        uint256 scope;
        uint256 context;
        uint256 IO0;
        uint256 IO1;
    }

    /**
     * @dev Simulate the
     * complete process of value commitment & releases
     * over multiple rounds.
     * note: Limiting to only operating over a simple field for now
     * run: forge test --ffi --match-test test_E2EProcess
     */
    function test_E2EProcess() public {}
}
