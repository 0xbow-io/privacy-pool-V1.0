#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the base directory relative to the script location
BASE_DIR="$(dirname "$0")"
CIRCUITNAME="privacyPool"

# CircomKit operations
echo "Running CircomKit operations..."
bunx circomkit clean
circom --sym --wasm --r1cs -p bn128 -o ./build/$CIRCUITNAME -l ./node_modules --verbose --inspect --O1 ./circuits/main/$CIRCUITNAME.circom
#bunx circomkit compile $CIRCUITNAME
bunx circomkit instantiate $CIRCUITNAME
bunx circomkit info $CIRCUITNAME
bunx circomkit setup $CIRCUITNAME
bunx circomkit prove $CIRCUITNAME default
bunx circomkit verify $CIRCUITNAME default
bunx circomkit contract $CIRCUITNAME