#!/bin/bash

echo "Fetching dependencies..."
bun run ./zero-knowledge/scripts/get-deps.sh  

echo "Compiling circuit builder..."
bun build --entrypoints ./zero-knowledge/scripts/privacy-pool/buildCircuit.ts --outdir ./zero-knowledge/scripts/privacy-pool --target node
echo "Compiling circuit with circomkit..."
ts-node ./zero-knowledge/scripts/privacy-pool/buildCircuit.js
