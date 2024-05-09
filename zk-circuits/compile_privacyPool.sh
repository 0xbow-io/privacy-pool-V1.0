#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the base directory relative to the script location
BASE_DIR="$(dirname "$0")"
CIRCUITNAME="privacyPool"

# CircomKit operations
echo "Running CircomKit operations..."
npx circomkit clean
npx circomkit compile privacyPool
npx circomkit info privacyPool
npx circomkit setup privacyPool