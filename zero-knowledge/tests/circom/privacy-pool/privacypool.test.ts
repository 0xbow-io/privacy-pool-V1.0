//  bunx jest ./tests/circom/privacy-pool/privacypool.test.ts

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils";
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge";
import { GenTestCases } from "@privacy-pool-v1/zero-knowledge";
import { test, describe, beforeAll, afterEach } from "@jest/globals";
import type { WitnessTester } from "circomkit";

describe("Test Privacy Pool template ", () => {
	const tcs = GenTestCases()();

	let circuit: WitnessTester<
		[
			"scope",
			"actualTreeDepth",
			"context",
			"externIO",
			"existingStateRoot",
			"newSaltPublicKey",
			"newCiphertext",
			"privateKey",
			"nonce",
			"exSaltPublicKey",
			"exCiphertext",
			"exIndex",
			"exSiblings",
		],
		["newNullRoot", "newCommitmentRoot", "newCommitmentHash"]
	>;

	afterEach(async () => {
		await cleanThreads();
	});

	// generate a set of commitments
	// and insert into the merkle tree
	beforeAll(async () => {
		circuit = await PrivacyPool.circomkit({
			file: "./privacy-pool/privacyPool",
			template: "PrivacyPool",
			params: [32, 7, 4, 2, 2],
			pubs: [
				"scope",
				"actualTreeDepth",
				"externIO",
				"existingStateRoot",
				"newSaltPublicKey",
				"newCiphertext",
			],
		}).witnessTester();
	});

	test(tcs[0][0].case, async () => {
		for (const tvariant of tcs) {
			console.log("Test case: ", tvariant[0]);
			const witness = await circuit.calculateWitness(tvariant[0].inputs);
			await circuit.expectConstraintPass(witness);
			await circuit.expectPass(tvariant[0].inputs, tvariant[0].expectedOutputs);
		}
	});
	test(tcs[0][1].case, async () => {
		for (const tvariant of tcs) {
			console.log("Test case: ", tvariant[1]);
			const witness = await circuit.calculateWitness(tvariant[1].inputs);
			await circuit.expectConstraintPass(witness);
			await circuit.expectPass(tvariant[1].inputs, tvariant[1].expectedOutputs);
		}
	});
	test(tcs[0][2].case, async () => {
		for (const tvariant of tcs) {
			console.log("Test case: ", tvariant[2]);
			const witness = await circuit.calculateWitness(tvariant[2].inputs);
			await circuit.expectConstraintPass(witness);
			await circuit.expectPass(tvariant[2].inputs, tvariant[2].expectedOutputs);
		}
	});
	test(tcs[0][3].case, async () => {
		for (const tvariant of tcs) {
			console.log("Test case: ", tvariant[3]);
			const witness = await circuit.calculateWitness(tvariant[3].inputs);
			await circuit.expectConstraintPass(witness);
			await circuit.expectPass(tvariant[3].inputs, tvariant[3].expectedOutputs);
		}
	});
	test(tcs[0][4].case, async () => {
		const i = 4;
		for (const tvariant of tcs) {
			console.log("Test case: ", tvariant[i]);
			const witness = await circuit.calculateWitness(tvariant[i].inputs);
			await circuit.expectConstraintPass(witness);
			await circuit.expectPass(tvariant[i].inputs, tvariant[i].expectedOutputs);
		}
	});
	test(tcs[0][5].case, async () => {
		const i = 5;
		for (const tvariant of tcs) {
			console.log("Test case: ", tvariant[i]);
			const witness = await circuit.calculateWitness(tvariant[i].inputs);
			await circuit.expectConstraintPass(witness);
			await circuit.expectPass(tvariant[i].inputs, tvariant[i].expectedOutputs);
		}
	});
});
