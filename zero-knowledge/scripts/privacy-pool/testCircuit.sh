#!/bin/bash

echo "generating test inputs..."
bun run ./zero-knowledge/scripts/privacy-pool/genTestInputs.ts
echo "verifying circuit with test inputs"
bunx jest ./zero-knowledge/tests/circom/privacy-pool/circuit.test.ts
echo "generating proofs for circuit with test inputs"
bunx jest ./zero-knowledge/tests/circom/privacy-pool/proof.test.ts

