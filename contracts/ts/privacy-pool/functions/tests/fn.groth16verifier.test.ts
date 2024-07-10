// run test with:
// bunx jest ./tests/fn.groth16verifier.test.ts

import fs from "node:fs";
import { expect, test, describe, afterEach, beforeAll } from "@jest/globals";
import { genTestData } from "@privacy-pool-v1/zero-knowledge";
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils";
import type { circomArtifactPaths } from "@privacy-pool-v1/global";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import type { Hex } from "viem";
import { FnGroth16Verifier } from "@privacy-pool-v1/contracts";
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge";

import type {
	ICircuit,
	TPrivacyPool,
	Groth16_VKeyJSONT,
	CircomArtifactT,
	CircomOutputT,
	StdPackedGroth16ProofT,
	SnarkJSOutputT,
} from "@privacy-pool-v1/zero-knowledge";

import {
	NewPrivacyPoolCircuit,
	FnPrivacyPool,
} from "@privacy-pool-v1/zero-knowledge";

describe("Testing CPrivacyPool", () => {
	describe("should pass with file paths", () => {
		const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false);
		const privacyPool = NewPrivacyPoolCircuit({
			vKey: fs.readFileSync(paths.VKEY_PATH, "utf-8"),
			wasm: paths.WASM_PATH,
			zKey: paths.ZKEY_PATH,
		});
		const verifierAddress: Hex = "0x7109fa91D440b5c723E1B5cc8098D14Ea7e6CF43";
		const onChainVerifier = FnGroth16Verifier.verifyProofFn(sepolia);

		beforeAll(async () => {});

		afterEach(async () => {
			await cleanThreads();
		});

		test.each(genTestData(10n)())(
			"should compute verifiable output for %s",
			async (test) => {
				// generate proof for test data
				// since verify defaults to true, this will
				// auto verify the proof
				// we also will pass down a callback function to
				// the verifier to verify the output on-chain
				const res = (await privacyPool
					.prove(test)(
						//callback fn to verify output on-chain
						async ({ out }) => {
							expect(out).toBeDefined();
							const packed = FnPrivacyPool.parseOutputFn("pack")(
								out as SnarkJSOutputT,
							);
							return {
								ok: await onChainVerifier(
									verifierAddress,
									packed as StdPackedGroth16ProofT<bigint>,
								),
								out: packed,
							};
						},
					)
					.catch((e) => {
						console.error(e);
					})) as { ok: boolean; out: StdPackedGroth16ProofT<bigint> };
				expect(res.ok).toEqual(true);
				console.log("packed output: ", res.out);

				// now simulate the commit Tx
				// then execute.
			},
		);
	});
});
