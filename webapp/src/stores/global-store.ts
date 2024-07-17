import { createStore } from "zustand/vanilla";
import { downloadJSON } from "@/utils/files";
import type { Chain } from "viem/chains";
import { sepolia, gnosis } from "viem/chains";
import { formatUnits } from "viem";
import type { Hex } from "viem";
import { ChainNameToChain, getDefaultRepresentation } from "@/network/pools";
import {
	ExistingPrivacyPools,
	SUPPORTED_CHAINS,
	DEFAULT_CHAIN,
} from "@privacy-pool-v1/contracts";
import type {
	PrivacyPoolMeta,
	OnChainPrivacyPool,
} from "@privacy-pool-v1/contracts";
import type { Commitment, PrivacyKey } from "@privacy-pool-v1/domainobjs";
import type { SupportSimpleFieldElements, SimpleFEMeta } from "@/network/pools";

export type GlobalState = {
	/**
	 * @dev The keys that are generated / uploaded by the user
	 * A privacykey is a Baby JubJuib friendly EdDSA private-key
	 * derived from a EcDSA private key
	 */
	keys: PrivacyKey[];

	/**
	 * @dev on-chain privacy pools
	 * each maintains its own state Merkle Tree
	 * which requires to be in sync with the on-chain state
	 */
	pools: OnChainPrivacyPool[];

	/**
	 * @dev Chain, Pool & Field Element that is currently selected
	 */
	currChain: Chain;
	currPool: OnChainPrivacyPool;
	currFE: SimpleFEMeta;
};

/**
 * @dev actions relevant to the global state
 * this encompasses the chain, pool and field element
 */
export interface GlobalActions {
	// update the current chain to the chain selected in the UI
	// this should then set currPool to the default pool of the chain
	updateTargetPoolChain: (value: string) => void;
	getCurrentPool: () => OnChainPrivacyPool;
}

/**
 * actions relevant to privacy keys management
 */
export interface KeyActions {
	// Generate a new key
	// Invokes the generate method from PrivacyKey Class
	genKey: () => PrivacyKey;
	// Import a key from Hex
	// Invokes the from method from PrivacyKey Class
	importKey: (key: Hex) => PrivacyKey;
	// Import the keys from JSON
	importKeysFromJSON: (data: string) => void;
	// Export the keys to JSON
	exportKeysToJSON: (download: boolean) => string;
}

export interface PoolActions {
	// call sync for the current pool (currPool)
	sync: () => boolean;
	// call decryptCiphers for the current pool
	decryptCiphers: (from: bigint, to: bigint) => void;

	/*
    TODO:
      * process --> call process on the current pool
        ** Do we use webworkers for this?
  */
}

export type GlobalStore = KeyActions & PoolActions & GlobalActions;

export const initiGlobalState: GlobalState = {
	keys: [],
	pools: [],
	currChain: DEFAULT_CHAIN,
};

export const initGlobalStore = (): GlobalState => initiGlobalState;

/*

	keys: [],

	availChains: [sepolia, gnosis],
	avilPools: PrivacyPools,
	supportedUnitRepresentatives: SupportedUnitRepresentatives,

	currChain: sepolia,
	currPool: getDefaultPool(),
	currUnitRepresentative: getDefaultRepresentation(),

	avilCommits: [],
	inCommits: ["", ""],

	publicValue: 0,
	inTotalValue: 0,

	outValues: [0.0, 0.0],
	outSplits: [100, 0],
	outPrivacyKeys: [],
	outTotalValue: 0,

	extraAmountIsValid: true,
	extraAmountReason: "",
	outputAmountIsValid: [false, false],
	outputAmountReasons: ["no encryption key set", "no encryption key set"],
  */
