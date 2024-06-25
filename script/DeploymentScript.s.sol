// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import "forge-std/console.sol";
import {Groth16Verifier} from "../src/Groth16Verifier.sol";
import {TreeHasher} from "../src/TreeHasher.sol";
import {PrivacyPool} from "../src/PrivacyPool.sol";

uint256 constant default_maxCommitVal = 1000000 * 1 ether;
address constant default_valueUnitRep = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
uint256 constant default_max_merkle_tree_depth = 32;

contract DeploymentScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        uint256 maxCommitVal = vm.envUint("MAX_COMMIT_VAL") == 0 ? default_maxCommitVal : vm.envUint("MAX_COMMIT_VAL") ;
        address valueUnitRep = vm.envAddress("VALUE_UNIT_REPRESENTATIVE") == address(0) ? default_valueUnitRep : vm.envAddress("VALUE_UNIT_REPRESENTATIVE");
        uint256 maxMerkleTreeDepth = vm.envUint("MAX_MERKLETREE_DEPTH") == 0 ? default_max_merkle_tree_depth : vm.envUint("MAX_MERKLETREE_DEPTH");

        console.log("deploying with these values -- maxCommitVal: %d valueUnitRep: %s maxMerkleTreeDepth: %d", maxCommitVal, valueUnitRep, maxMerkleTreeDepth);

        vm.startBroadcast(deployerPrivateKey);

        //deploy the first contract and get the address
        Groth16Verifier groth16Verifier = new Groth16Verifier();
        address groth16VerifierAddress = address(groth16Verifier);

        //deploy the second contract and get the address
        TreeHasher treehasher = new TreeHasher();
        address treehasherAddress = address(treehasher);

        //deploy the third and final contract with the addresses of the previously deployed contracts
        new PrivacyPool(groth16VerifierAddress, treehasherAddress, maxCommitVal, valueUnitRep, maxMerkleTreeDepth);

        vm.stopBroadcast();
    }
}
