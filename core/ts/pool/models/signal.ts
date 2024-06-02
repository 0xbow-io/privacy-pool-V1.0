import { Address } from 'viem';
import { caclSignalHash } from '@core/pool/utils';

export interface ISignal {
  Hash(publicVal: bigint): { hash: bigint; extVal: bigint };
}

export class Signal implements ISignal {
  constructor(
    public poolAddrs: Address,
    public executor: Address,
    public feeCollector: Address,
    public feeVal: bigint,
  ) {}

  Hash(publicVal: bigint): { hash: bigint; extVal: bigint } {
    const hash: bigint = caclSignalHash(
      this.poolAddrs,
      publicVal,
      this.feeVal,
      this.executor,
      this.feeCollector,
    );
    const extVal: bigint = publicVal + this.feeVal;
    return {
      hash,
      extVal,
    };
  }
}
