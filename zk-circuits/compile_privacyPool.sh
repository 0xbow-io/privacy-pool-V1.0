#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the base directory relative to the script location
BASE_DIR="$(dirname "$0")"
CIRCUITNAME="privacyPool"

# CircomKit operations
echo "Running CircomKit operations..."
npx circomkit clean
npx circomkit compile $CIRCUITNAME
npx circomkit instantiate $CIRCUITNAME
npx circomkit info $CIRCUITNAME
npx circomkit setup $CIRCUITNAME
npx circomkit prove $CIRCUITNAME default
npx circomkit verify $CIRCUITNAME default
npx circomkit contract $CIRCUITNAME