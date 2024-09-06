#!/bin/bash

echo "Fetching dependencies..."
bun run ./packages/zero-knowledge/scripts/get-deps.sh

echo "Compiling circuit builder..."
bun build --entrypoints ./packages/zero-knowledge/scripts/privacy-pool/buildCircuit.ts --outdir ./packages/zero-knowledge/scripts/privacy-pool --target node
echo "Compiling circuit with circomkit..."
ts-node ./packages/zero-knowledge/scripts/privacy-pool/buildCircuit.js
