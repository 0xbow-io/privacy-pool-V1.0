##!/bin/bash

## Get all the dependencies
echo "Fetching dependencies..."
forge install OpenZeppelin/openzeppelin-contracts
forge install privacy-scaling-explorations/zk-kit.solidity
forge install vimwitch/poseidon-solidity

## build helper script for tests
echo "building test helper scripts..."
bun build --entrypoints ./generate_single_proof.ts --outfile generate_single_proof.js --target node

## run test script
echo "compile contracts & run tests"
forge test --ffi -v

## generate the ABI bindings
echo "generating ABI bindings..."
bun run ./gen_abi_bindings.ts