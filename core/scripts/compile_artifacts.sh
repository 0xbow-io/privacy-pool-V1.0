#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the base directory relative to the script location
BASE_DIR="$(dirname "$0")"
CIRCUITNAME="privacyPool"

echo "Compiling circuit with circomkit..."

echo '{"protocol":"groth16","prime":"bn128","version":"2.1.9","verbose":true}' > circomkit.json
echo '{  "privacyPool": {    "file": "privacyPool",    "template": "PrivacyPool",    "dir": "main",    "pubs": ["publicVal", "signalHash", "merkleProofLength", "inputNullifier", "outCommitment"],    "params": [32, 2, 2]  }}' > circuits.json

circomkit clean $CIRCUITNAME
circomkit compile $CIRCUITNAME
circomkit info $CIRCUITNAME
circomkit setup $CIRCUITNAME

echo "Generating solidity verifier"
rm contracts/src/Groth16Verifier.sol
snarkjs zkey export solidityverifier build/$CIRCUITNAME/groth16_pkey.zkey contracts/src/Groth16Verifier.sol

echo "Compiling contracts"
bunx hardhat compile

echo "Done !"

rm circomkit.json
rm circuits.json