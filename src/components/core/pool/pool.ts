import { poolState } from './state';
import { Ctx } from '@core/account';
import { Address } from 'viem';

interface PrivacyPool {
  UpdateWithNewCtx(ctx: Ctx): void;
  UpdateWithNewNullifier(nullfier: bigint): void;
}

export class pool extends poolState implements PrivacyPool {
  latestBlock: bigint = 0n;

  constructor(id: string, address: Address, genesis: bigint) {
    super();
  }

  UpdateWithNewCtx(ctx: Ctx) {}
  UpdateWithNewNullifier(nullifier: bigint) {}
}
