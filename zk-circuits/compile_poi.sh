#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the base directory relative to the script location
BASE_DIR="$(dirname "$0")"
CIRCUITNAME="proofOfInnocence"

# CircomKit operations
echo "Running CircomKit operations..."
npx circomkit clean
npx circomkit compile proofOfInnocence
npx circomkit info proofOfInnocence
npx circomkit setup proofOfInnocence
npx circomkit prove proofOfInnocence default
npx circomkit verify proofOfInnocence default

# Directory operations for copying and moving files
echo "copying artifacts for wasm..."
TARGET_DIR="${BASE_DIR}/poi-wasm-nova/wasm/artifacts/circuits"

# Check if the target directory exists, delete if it does, then create it
if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
fi
mkdir -p "$TARGET_DIR"

# Copy the directory
echo "copying ${CIRCUITNAME}_js..."
cp -r "${BASE_DIR}/build/${CIRCUITNAME}/${CIRCUITNAME}_js" "$TARGET_DIR"

# Move the file
echo "copying ${CIRCUITNAME}.r1cs..."
cp "${BASE_DIR}/build/${CIRCUITNAME}/${CIRCUITNAME}.r1cs" "$TARGET_DIR"

# Cargo operations inside poi-wasm-nova
echo "Running Cargo operations inside poi-wasm-nova..."
cd "${BASE_DIR}/poi-wasm-nova"
echo "building project..."
cargo build
echo "generating cbor from r1cs..."
cargo run --bin create-cbor

echo "All operations completed successfully."