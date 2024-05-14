#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the base directory relative to the script location
BASE_DIR="$(dirname "$0")"
CIRCUITNAME="privacyPool"

echo "Compiling circuit & generating test data..."
rm -f circomkit.json
rm -f circuit.json
rm -f inputs/$CIRCUITNAME/default.json
bun test privacyPool --timeout 60000

# CircomKit operations
echo "Running CircomKit operations..."
circomkit setup $CIRCUITNAME
circomkit contract $CIRCUITNAME

for VARIABLE in 1 2 3 4 5 .. N
do
    circomkit prove $CIRCUITNAME test_$VARIABLE
    circomkit verify $CIRCUITNAME test_$VARIABLE
    circomkit calldata $CIRCUITNAME test_$VARIABLE
done

