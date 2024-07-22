// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/verifier/groth16_verifier.sol";
import "../src/PrivacyPool.sol";
import "../src/Constants.sol";

contract DeploymentScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address FIELD_INTERPRETER = vm.envAddress("FIELD_INTERPRETER") == address(0)
            ? D_BASE_FIELD_INTERPRETER
            : vm.envAddress("FIELD_INTERPRETER");

        vm.startBroadcast(deployerPrivateKey);

        //deploy the first contract and get the address
        Groth16Verifier groth16Verifier = new Groth16Verifier();
        address groth16VerifierAddress = address(groth16Verifier);

        //deploy the third and final contract with the addresses of the previously deployed contracts
        new PrivacyPool(FIELD_INTERPRETER, groth16VerifierAddress);

        //TO-DO add some sanity checks here

        vm.stopBroadcast();
    }
}
