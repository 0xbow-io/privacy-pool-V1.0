// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "forge-std/StdJson.sol";

import "../src/verifier/groth16_verifier.sol";

contract TestGroth16Verifier is Test {
    Groth16Verifier internal verifier;

    using stdJson for string;

    function setUp() public {
        verifier = new Groth16Verifier();
    }

    struct ProofJson {
        uint256[] proof;
    }
    /**
     * @dev Test the compiled Groth16 Verifier
     * against test-data that were generated via
     * the script: zero-knowledge/scripts/privacy-pool/genTestVerifierData.ts
     * run: forge test --match-test test_verifyProof -v
     */

    function test_verifyProof() public {
        string memory root = vm.projectRoot();
        string memory testDataDir = string.concat(root, "/test/test-data/");

        for (uint256 i = 0; i < 4; i++) {
            for (uint256 j = 0; j < 6; j++) {
                string memory filename = string.concat("testcase_", vm.toString(i), "_", vm.toString(j), ".json");
                string memory fullPath = string.concat(testDataDir, filename);

                // Check if the file exists before processing
                if (vm.exists(fullPath)) {
                    string memory json = vm.readFile(fullPath);

                    uint256[2] memory pA;
                    pA[0] = json.readUint(".proof[0][0]");
                    pA[1] = json.readUint(".proof[0][1]");

                    uint256[2][2] memory pB;
                    pB[0][0] = json.readUint(".proof[1][0][0]");
                    pB[0][1] = json.readUint(".proof[1][0][1]");
                    pB[1][0] = json.readUint(".proof[1][1][0]");
                    pB[1][1] = json.readUint(".proof[1][1][1]");

                    uint256[2] memory pC;
                    pC[0] = json.readUint(".proof[2][0]");
                    pC[1] = json.readUint(".proof[2][1]");

                    uint256[36] memory pubSignals;
                    for (uint256 l = 0; l < 36; l++) {
                        pubSignals[l] = json.readUint(string.concat(".proof[3][", vm.toString(l), "]"));
                    }

                    bool result = verifier.verifyProof(pA, pB, pC, pubSignals);
                    assertTrue(result, "proof verificaton failed");
                }
            }
        }
    }
}