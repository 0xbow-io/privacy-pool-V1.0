##!/bin/bash
forge install OpenZeppelin/openzeppelin-contracts
forge install privacy-scaling-explorations/zk-kit.solidity
forge install vimwitch/poseidon-solidity
forge remappings > remappings.txt

bun build --entrypoints ./generate_single_proof.ts --outfile generate_single_proof.js --target node
