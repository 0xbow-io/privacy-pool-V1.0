import { Address } from 'viem';
import { ICommitment } from '@core/account/models';

export type Intent = {
  inputs: ICommitment[];
  outputs: ICommitment[];
  account: Address;
  feeCollector: Address;
  feeVal: bigint;
};

export type Signal = Omit<Intent, 'inputs' | 'outputs'> & {
  pool: Address;
  extVal: bigint;
};
