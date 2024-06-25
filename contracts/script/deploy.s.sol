// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import "forge-std/console.sol";
import {Groth16Verifier} from "../src/verifier/groth16_verifier.sol";
import {PrivacyPool} from "../src/PrivacyPool.sol";

//TO-DO Have defaults in the Constant.sol file not here..
uint256 constant default_max_units = 1000000 * 1 ether;
address constant default_units_rep = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

contract DeploymentScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 maxUnitsAllowed = vm.envUint("MAX_UNITS_ALLOWED") == 0 ? default_max_units : vm.envUint("MAX_UNITS_ALLOWED") ;
        address unitRep = vm.envAddress("UNIT_REPRESENTATION") == address(0) ? default_units_rep : vm.envAddress("UNIT_REPRESENTATION");

        console.log("deploying with these values -- maxCommitVal: %d valueUnitRep: %s maxMerkleTreeDepth: %d", maxUnitsAllowed, unitRep);

        vm.startBroadcast(deployerPrivateKey);

        //deploy the first contract and get the address
        Groth16Verifier groth16Verifier = new Groth16Verifier();
        address groth16VerifierAddress = address(groth16Verifier);

        //deploy the third and final contract with the addresses of the previously deployed contracts
        new PrivacyPool(maxUnitsAllowed,unitRep,groth16VerifierAddress);

        //TO-DO add some sanity checks here

        vm.stopBroadcast();
    }
}
