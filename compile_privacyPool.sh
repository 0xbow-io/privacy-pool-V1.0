#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the base directory relative to the script location
BASE_DIR="$(dirname "$0")"
CIRCUITNAME="privacyPool"


echo "Compiling circuit & generating test data..."

rm -f circomkit.json
rm -f circuits.json

rm -rf inputs/$CIRCUITNAME
rm -rf build/$CIRCUITNAME

mkdir -p inputs/$CIRCUITNAME
bun test privacyPool --timeout 60000

circomkit compile $CIRCUITNAME
circomkit info $CIRCUITNAME

# CircomKit operations
echo "Running CircomKit operations..."
circomkit setup $CIRCUITNAME
snarkjs zkey export solidityverifier build/$CIRCUITNAME/groth16_pkey.zkey build/$CIRCUITNAME/verifier.sol  

for VARIABLE in 0 1 2
do
    circomkit prove $CIRCUITNAME test_$VARIABLE
    circomkit verify $CIRCUITNAME test_$VARIABLE
    snarkjs zkey export soliditycalldata build//$CIRCUITNAME/test_$VARIABLE/public.json build/privacypool/test_$VARIABLE/groth16_proof.json
done

