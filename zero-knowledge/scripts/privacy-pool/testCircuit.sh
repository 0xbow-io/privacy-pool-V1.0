#!/bin/bash

echo "testing domain/commitment templates..."
bunx jest ./tests/circom/privacy-pool/domain.commitment.test.ts
echo "testing domain/stateTree templates..."
bunx jest ./tests/circom/privacy-pool/domain.stateTree.test.ts
echo "testing privacy-pool/handlers templates..."
bunx jest ./tests/circom/privacy-pool/privacypool.handlers.test.ts
echo "testing privacy-pool/privacypool template..."
bunx jest ./tests/circom/privacy-pool/privacypool.test.ts
echo "testing proof generation with snarkjs"
bunx jest ./tests/circom/privacy-pool/genProof.test.ts
