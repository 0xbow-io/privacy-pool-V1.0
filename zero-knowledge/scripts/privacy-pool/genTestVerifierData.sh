#!/bin/bash

echo "Compiling gnenerator."
bun build --entrypoints ./zero-knowledge/scripts/privacy-pool/genTestVerifierData.ts --outdir ./zero-knowledge/scripts/privacy-pool --target node
echo "preparing test data for verifier contract"
ts-node ./zero-knowledge/scripts/privacy-pool/genTestVerifierData.js
