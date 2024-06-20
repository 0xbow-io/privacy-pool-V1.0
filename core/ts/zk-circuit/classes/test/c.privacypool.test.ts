import type { TCommitment, Commitment, PrivacyKey} from '@privacy-pool-v1/core-ts/account';
import { type PrivacyPoolCircuit } from '@privacy-pool-v1/core-ts/zk-circuit';
import { FnPrivacyPool } from '@privacy-pool-v1/core-ts/zk-circuit';

import {CreateCommitment, CreatePrivacyKey } from '@privacy-pool-v1/core-ts/account';
import { 
    WASM_PATH, 
    ZKEY_PATH, 
    VKEY_PATH, 
    NewPrivacyPoolCircuit
} from '@privacy-pool-v1/core-ts/zk-circuit';

import fs from 'fs';

import { expect, test, describe, beforeEach } from "@jest/globals";
import { LeanIMT } from '@zk-kit/lean-imt';
import { hashLeftRight } from 'maci-crypto';



function getTestDummyCommimtment(pK: PrivacyKey): Commitment {
    return CreateCommitment(pK, {amount: 0n});
}
function genTestCommitment(amount: bigint, pK: PrivacyKey): Commitment {
    return CreateCommitment(pK, {amount: amount});
}
function genTestCommitments(specs: {amount: bigint, pK: PrivacyKey}[]): Commitment[] {
    return specs.map((spec) => genTestCommitment(spec.amount, spec.pK));
}

describe('Test Classes', () => {
    describe('Test Generating & Verifying Proof', () => {
        let mt: LeanIMT; 
        let pK: PrivacyKey;

        const test_non_zero_amounts = [50n, 100n, 150n, 200n, 250n, 300n];
        let commitments: Commitment[];

        const verifierKey = JSON.parse(fs.readFileSync(VKEY_PATH, 'utf-8'));

        let privacyPool: PrivacyPoolCircuit


        beforeEach(async () => {
            mt = new LeanIMT(hashLeftRight);
            pK = CreatePrivacyKey();

            privacyPool = NewPrivacyPoolCircuit({
                vKey: verifierKey,
                zKeyPath: ZKEY_PATH,
                wasmPath: WASM_PATH,
            })

            // generate commitments for non zero amounts
            // and insert into merkle tree
            commitments = test_non_zero_amounts.map((amount) => {
                const commitment = genTestCommitment(amount, pK);
                mt.insert(commitment.hash);
                commitment.index = BigInt(mt.size-1);
                return commitment;
            });
        });
    
        test('Input: (0, 50), Ouptut: (0, 100), PublicVal: 50', async () => {
            const non_zero_output = genTestCommitment(100n, pK)
            const inputs: TCommitment.RawT[] = [commitments[0].raw, getTestDummyCommimtment(pK).raw];
            const outputs: TCommitment.RawT[] = [getTestDummyCommimtment(pK).raw, non_zero_output.raw];

            privacyPool.inputs = FnPrivacyPool.GetInputsFn(mt, inputs, outputs, 100n)
            await privacyPool.compute();
            expect(privacyPool.output).toBeDefined();
            
            const ok = await privacyPool.verify(privacyPool.output!);
            expect(ok).toEqual(true);

            expect(privacyPool.output!.publicSignals[0]).toEqual(mt.root);            
        });

        //TO-DO: Add Negative Tests
        
    });
});