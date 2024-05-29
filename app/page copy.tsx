'use client';

import React, { useEffect, useState, useCallback, forwardRef, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedBeam } from '@/components/magicui/animated-beam';
import privacyPoolsLogo from '@images/privacy-pools-logo.svg';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useXarrow, Xwrapper } from 'react-xarrows';
import Xarrow from 'react-xarrows';

import { ASPList } from '@core/asp';

import {
  KeyRound,
  Upload,
  Pickaxe,
  UserRoundPlus,
  SaveAll,
  Wallet,
  FileInput,
  Parentheses,
  SquareFunction,
  PencilLine,
} from 'lucide-react';
import DotPattern from '@/components/magicui/dot-pattern';

import { account } from '@core/account';
import { Keypair, PrivKey, PubKey } from 'maci-domainobjs';
import { downloadJSON } from '@/utils/files';
import {
  PrivacyPools,
  PrivacyPool,
  getSupportedChains,
  getPoolsforChain,
  getPoolFromIdentifier,
} from '@core/pool';

import { useDropzone } from 'react-dropzone';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { txRecord } from '@/components/core/account';
import { hexToBigInt, Hex } from 'viem';
import { Commitment } from '../../src/components/core/pool/events';

const SmallContainer = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div ref={ref} className={cn('z-10 flex items-center justify-center rounded-xl', className)}>
      {children}
    </div>
  );
});

export default function AppPage() {
  const [currentAccount, setAccount] = useState<account | null>(null);
  const [currentPubKey, setPubKey] = useState<PubKey | null>(null);
  const [isPubKeySet, setIsPubKeySet] = useState<boolean>(false);
  const [isAccountLoaded, setIsAccountLoaded] = useState<boolean>(false);
  const [currentPool, setCurrentPool] = useState<string>('');
  const [currentASP, setCurrentASP] = useState<string>('');

  // for computing CTXs:
  const [accPubKey, setAccPubKey] = useState('');
  const [inputCommitment1, setInputCommitment1] = useState('');
  const [inputCommitment1Value, setInputCommitment1Value] = useState<bigint>(0n);
  const [inputCommitment2, setInputCommitment2] = useState('');
  const [inputCommitment2Value, setInputCommitment2Value] = useState<bigint>(0n);

  const [outCommitmentAmount1, setOutCommitmentAmount1] = useState('');
  const [outCommitmentPubkey1, setOutCommitmentPubKey1] = useState('');
  const [outCommitmentAmount2, setOutCommitmentAmount2] = useState('');
  const [outCommitmentPubkey2, setOutCommitmentPubKey2] = useState('');
  const [publicVal, setPublicVal] = useState<bigint>(0n);
  const [feeVal, setFeeVal] = useState<bigint>(0n);

  // whether the computed Tx Record is a commitment or release;
  const [isCommit, setIsCommit] = useState<boolean>(true);
  const [currTxRecord, setTxRecord] = useState<txRecord | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const MenuBarRef = useRef<HTMLDivElement>(null);
  const TxRecordRef = useRef<HTMLDivElement>(null);
  const InCommitment1Ref = useRef<HTMLDivElement>(null);
  const InCommitment2Ref = useRef<HTMLDivElement>(null);
  const OutCommitment1Ref = useRef<HTMLDivElement>(null);
  const OutCommitment2Ref = useRef<HTMLDivElement>(null);
  const AccSelectionRef = useRef<HTMLDivElement>(null);
  const ExecuteRef = useRef<HTMLDivElement>(null);
  const ASPSelectionRef = useRef<HTMLDivElement>(null);
  const RelayerSelectionRef = useRef<HTMLDivElement>(null);

  // on file drop to load local account
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    let Account = new account();
    if (Account === null) {
      throw new Error('Failed to create account');
    }

    const fileReader = new FileReader();

    if (acceptedFiles[0]) {
      fileReader.readAsText(acceptedFiles[0], 'UTF-8');
      fileReader.onload = (d) => {
        if (d.target === null) {
          throw new Error('Failed to read file');
        }
        if (d.target.result) {
          const content = d.target.result;
          Account.LoadFromJSON(content.toString());
        } else {
          throw new Error('Failed to read file');
        }
      };
    }
    setAccount(Account);
    setIsAccountLoaded(true);
  }, []);

  // create a new fresh account
  const handleCreateAccount = () => {
    let Account = new account();
    if (Account === null) {
      throw new Error('Failed to create account');
    }

    setAccount(Account);

    // generate a keypair
    let keypair = Account?.genKeyPair();
    if (keypair === null) {
      throw new Error('Failed to generate keypair');
    }

    setPubKey(keypair.pubKey);
    setIsPubKeySet(true);

    setIsAccountLoaded(true);

    // download account as json
    downloadJSON(Account?.ExportToJSON(), 'privacy_pool_account.json');
  };

  // create privacy key for account
  const handleAddPrivacyKey = () => {
    if (currentAccount === null) {
      throw new Error('Account not loaded');
    }

    // generate a keypair
    let keypair = currentAccount?.genKeyPair();
    if (keypair === null) {
      throw new Error('Failed to generate keypair');
    }

    setPubKey(keypair.pubKey);
    setIsPubKeySet(true);

    // download account as json
    downloadJSON(currentAccount?.ExportToJSON(), 'privacy_pool_account.json');
  };

  // create privacy key for account
  const handleSaveAccountState = () => {
    if (currentAccount === null) {
      throw new Error('Account not loaded');
    }

    // download account as json
    downloadJSON(currentAccount?.ExportToJSON(), 'privacy_pool_account.json');
  };

  const handleCommitmentChoice = (value: string) => {};

  // set the target privacy pool
  const handleSetPool = async (poolIdentifier: string) => {
    setCurrentPool(poolIdentifier);

    let pool = getPoolFromIdentifier(poolIdentifier);

    await pool?.state.syncCurrentOnChainRoot();
    await pool?.state.syncCurrentSize();
    await pool?.state.syncCurrentDepth();

    console.log('latest root: ', pool?.state.CurrentOnChainRoot());
    console.log('latest size: ', pool?.state.CurrentOnChainSize());
    console.log('latest depth: ', pool?.state.CurrentOnChainDepth());
  };

  const getCurrTxRecordPublicVal = (): string => {
    if (currTxRecord === null) {
      return '0.000';
    }

    return currTxRecord.publicVal.toString();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const generateOutCTX = (id: number) => {};

  const handleOutCommitmentKeyChoice = (value: string, commitmentID: number) => {
    if (commitmentID === 1) {
      setOutCommitmentPubKey1('0x' + value);
    } else if (commitmentID === 2) {
      setOutCommitmentPubKey2('0x' + value);
    }
  };

  const handleOutCommitmentAmntChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    let newAmount = 0n;
    if (value == '-') {
      newAmount = -0n;
    } else {
      newAmount = BigInt(value);
    }

    let newOuts = [BigInt(outCommitmentAmount1), BigInt(outCommitmentAmount2)];
    if (name === '1') {
      setOutCommitmentAmount1(newAmount.toString());
      newOuts[0] = newAmount;
    } else if (name === '2') {
      setOutCommitmentAmount2(newAmount.toString());
      newOuts[1] = newAmount;
    }
    UpdatePublicVal(newOuts, [inputCommitment1Value, inputCommitment2Value]);
  };

  const GetAccPublicAddrr = (): Hex => {
    if (accPubKey == '' || currentAccount === undefined || currentAccount === null) {
      return '0x0000';
    }
    return currentAccount.pubAddressFromPkHash(BigInt(accPubKey));
  };

  const AccountPrivKeyDropDown = () => {
    if (currentAccount === undefined) {
      return <div></div>;
    }
    return (
      <Select value={accPubKey} onValueChange={(value) => setAccPubKey(value)}>
        <SelectTrigger className=" text-dark-2  max-w-fit justify-start border-none bg-inherit text-3xl font-semibold underline decoration-orange decoration-4 duration-300 ease-in hover:bg-black-2 hover:text-white">
          <SelectValue placeholder="{choose account}">
            {GetAccPublicAddrr().substring(0, 6)}...{GetAccPublicAddrr().substring(26, 32)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {currentAccount?.GetPrivacyKeys().map((privacyKey) => {
              return (
                <SelectItem value={'0x' + privacyKey.keypair.pubKey.hash().toString(16)}>
                  {privacyKey.pubAddr.substring(0, 8)}...{privacyKey.pubAddr.substring(36, 42)}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  // Card for selecting execution account
  const AccSelectionCard = (className: string, ref: any) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col items-center justify-center duration-300 ease-in hover:translate-y-1',
          className,
        )}
      >
        <div>{AccountPrivKeyDropDown()}</div>
      </div>
    );
  };

  const ASPSelectionDropDown = () => {
    if (currentAccount === undefined) {
      return <div></div>;
    }
    return (
      <Select value={currentASP} onValueChange={(value) => UpdateCurrentASP(value)}>
        <SelectTrigger className=" text-dark-2 max-w-fit  border-none bg-inherit text-3xl font-semibold underline decoration-orange decoration-4 duration-300 ease-in hover:bg-black-2 hover:text-white">
          <SelectValue placeholder="{choose ASP}">{currentASP}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Array.from(ASPList.values())
              .map((asp) => asp.name)
              .map((asp) => {
                return <SelectItem value={asp}>{asp} ASP </SelectItem>;
              })}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  // Card for selecting ASP
  const ASPSelectionCard = (className: string, ref: any) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col items-center justify-center duration-300 ease-in hover:translate-y-1',
          className,
        )}
      >
        <div>{ASPSelectionDropDown()}</div>
      </div>
    );
  };

  // Card for selecting Relayer
  const RelayerSelectionDropDown = () => {
    if (currentAccount === undefined) {
      return <div></div>;
    }
    return (
      <Select value={currentASP} onValueChange={(value) => UpdateCurrentASP(value)}>
        <SelectTrigger className="text-dark-2 justify-start border-none bg-inherit text-4xl font-semibold duration-300 ease-in hover:bg-white hover:text-black-2">
          <SelectValue placeholder="Choose Relayer">{currentASP}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Array.from(ASPList.values())
              .map((asp) => asp.name)
              .map((asp) => {
                return <SelectItem value={asp}>{asp} ASP </SelectItem>;
              })}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  const RelayerSelectionCard = (className: string, ref: any) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col items-center justify-center duration-300 ease-in hover:translate-y-1',
          className,
        )}
      >
        <div>{RelayerSelectionDropDown()}</div>
      </div>
    );
  };

  const OutCommitmentKeyDropDown = (commitmentID: number) => {
    return (
      <Select
        value={
          commitmentID === 1
            ? outCommitmentPubkey1.substring(0, 20)
            : outCommitmentPubkey2.substring(0, 20)
        }
        onValueChange={(value) => handleOutCommitmentKeyChoice(value, commitmentID)}
      >
        <SelectTrigger className="justify-start border border-blue bg-white text-sm font-semibold text-blue duration-300 ease-in hover:bg-black-2 hover:text-white">
          <SelectValue placeholder="Attach Privacy key">
            {commitmentID === 1
              ? outCommitmentPubkey1.substring(0, 20)
              : outCommitmentPubkey2.substring(0, 20)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {currentAccount?.GetPubKeys().map((pubkey) => {
              return <SelectItem value={pubkey}>Pubkey: 0x{pubkey.substring(0, 10)}...</SelectItem>;
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  // Card for creating the out commitment.
  const OutCommitmentCard = (
    className?: string,
    children?: React.ReactNode,
    commitmentID?: number,
    ref?: any,
  ) => {
    if (commitmentID === undefined) {
      throw new Error('commitmentID not set');
    }
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col justify-start px-10 py-10 duration-300 ease-in hover:translate-y-1 ',
          className,
        )}
      >
        <div className="flex flex-col justify-start gap-4">
          <Input
            type="text"
            placeholder="Enter Amount"
            value={commitmentID === 1 ? outCommitmentAmount1 : outCommitmentAmount2}
            name={commitmentID.toString()}
            onChange={(e) => handleOutCommitmentAmntChange(e)}
            className="border-0 bg-inherit text-3xl focus:outline-none "
          />
          {OutCommitmentKeyDropDown(commitmentID)}
        </div>
        {children}
      </div>
    );
  };

  const HandleInputCommitmentChange = (value: string, commitmentID: number) => {
    let newIns = [inputCommitment1Value, inputCommitment2Value];
    if (commitmentID === 1) {
      setInputCommitment1(value);
      if (value == 'virtual') {
        setInputCommitment1Value(0n);
        newIns[0] = 0n;
      }
    } else if (commitmentID === 2) {
      setInputCommitment2(value);
      if (value == 'virtual') {
        setInputCommitment2Value(0n);
        newIns[1] = 0n;
      }
    }
    UpdatePublicVal(
      [BigInt(outCommitmentAmount1), BigInt(outCommitmentAmount2)],
      [inputCommitment1Value, inputCommitment2Value],
    );
  };

  const InputCommitmentDropDown = (commitmentID: number) => {
    return (
      <Select
        value={commitmentID == 1 ? inputCommitment1 : inputCommitment2}
        onValueChange={(value) => HandleInputCommitmentChange(value, commitmentID)}
      >
        <SelectTrigger className="justify-start border-none bg-inherit text-4xl font-semibold text-white duration-300 ease-in hover:bg-white hover:text-black-2">
          <SelectValue placeholder="Commitment">
            {commitmentID == 1 ? inputCommitment1 : inputCommitment2}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="virtual"> Virtual: 0</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  // Card for creating the out commitment.
  const InputCommitmentCard = (className: string, ref: any, commitmentID: number) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col items-center justify-center duration-300 ease-in hover:translate-y-1',
          className,
        )}
      >
        <div className="">{InputCommitmentDropDown(commitmentID)}</div>
      </div>
    );
  };

  const ExecuteCard = (className: string, ref: any) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col justify-start duration-300 ease-in hover:translate-y-1',
          className,
        )}
      >
        <div className="flex flex-col justify-start gap-10">
          <div className="flex flex-row flex-wrap">
            <div>
              <a className={publicVal == 0n ? ' text-red-dark' : 'font-bold text-sea-green'}>
                {publicVal >= 0 ? 'Committing' : 'Releasing'}{' '}
              </a>
              <a className="underline decoration-orange decoration-4">
                {publicVal < 0 ? (publicVal * -1n).toString() : publicVal.toString()} ETH
              </a>{' '}
              with
            </div>
            <div>{AccountPrivKeyDropDown()}</div>
            <h1>
              {' '}
              paying{' '}
              <a className=" underline decoration-orange decoration-4"> {feeVal.toString()} </a> ETH
              fee to
            </h1>
            <div>{ASPSelectionDropDown()}</div>
          </div>
          <div>
            <Button
              id="compute-button"
              onClick={handleCreateAccount}
              className={cn(
                'z-10 min-h-fit min-w-fit rounded-full font-semibold text-white',
                publicVal == 0n ? 'bg-red-dark' : 'duration-10000 animate-pulse bg-sea-green',
              )}
            >
              <h1 className="text-3xl font-bold text-white"> Compute </h1>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const TxRecordBuilder = (className: string, ref: any) => {
    return (
      <Xwrapper>
        <div ref={ref} className={cn('grid grid-cols-4 grid-rows-3 gap-x-6', className)}>
          <div className="z-0 col-span-4 col-start-1 row-start-1 mt-6 grid grid-cols-subgrid items-start bg-black-2 px-6 py-6">
            <div className="col-start-1">
              <h1 className="text-7xl font-bold text-white"> Inputs </h1>
            </div>
            <div className="col-span-2 col-start-2 flex flex-col gap-10 ">
              <div className="flex flex-row justify-between">
                <div className="rounded-3xl border border-white bg-black-2 ">
                  {InputCommitmentCard('text-white py-6', InCommitment1Ref, 1)}
                </div>
                <div className="rounded-3xl border border-white bg-black-2 ">
                  {InputCommitmentCard('text-white py-6', 2)}
                </div>
              </div>
            </div>
          </div>

          <div className=" col-span-4 col-start-1 row-start-2 grid grid-cols-subgrid items-start bg-white  px-6 py-6">
            <div className="col-span-2 col-start-2 mx-6 my-6 rounded-3xl ">
              {ExecuteCard('text-3xl font-bold px-10 py-10 text-black-2  ', ExecuteRef)}
            </div>
          </div>

          <div className="z-0 col-span-4 col-start-1  row-start-3 mb-6 grid grid-cols-subgrid items-center bg-black-2 px-6 py-10">
            <div className="col-start-1">
              <h1 className="text-7xl font-bold text-white"> Outputs </h1>
            </div>
            <div className=" col-start-2 rounded-3xl border border-white bg-black-2 ">
              {OutCommitmentCard('text-white px-6', '', 1, OutCommitment1Ref)}
            </div>
            <div className="col-start-3 rounded-3xl border border-white bg-black-2">
              {OutCommitmentCard('text-white px-6', '', 2, OutCommitment2Ref)}
            </div>
          </div>
        </div>
        <Xarrow
          zIndex={0}
          start={InCommitment1Ref}
          end={ExecuteRef}
          startAnchor={'bottom'}
          endAnchor={'top'}
          lineColor={'#F8F7F2'}
          tailColor={'#0d0c2b'}
          path={'grid'}
          strokeWidth={2}
          dashness={{ strokeLen: 5, nonStrokeLen: 10, animation: 2 }}
        />
        <Xarrow
          zIndex={0}
          start={InCommitment2Ref}
          end={ExecuteRef}
          startAnchor={'bottom'}
          endAnchor={'top'}
          lineColor={'#F8F7F2'}
          headColor={'#F8F7F2'}
          path={'grid'}
          strokeWidth={2}
          dashness={{ strokeLen: 5, nonStrokeLen: 10, animation: 2 }}
        />
        <Xarrow
          zIndex={0}
          start={ExecuteRef}
          end={OutCommitment1Ref}
          startAnchor={'bottom'}
          endAnchor={'top'}
          headColor={'#F8F7F2'}
          lineColor={'#F8F7F2'}
          path={'grid'}
          strokeWidth={2}
          dashness={{ strokeLen: 10, nonStrokeLen: 5, animation: 2 }}
        />
        <Xarrow
          zIndex={0}
          start={ExecuteRef}
          end={OutCommitment2Ref}
          startAnchor={'bottom'}
          endAnchor={'top'}
          headColor={'#F8F7F2'}
          lineColor={'#F8F7F2'}
          path={'grid'}
          strokeWidth={2}
          dashness={{ strokeLen: 10, nonStrokeLen: 5, animation: 2 }}
        />
      </Xwrapper>
    );
  };

  // menu
  const MenuBar = (className: string, ref: any) => {
    return (
      <div ref={ref} className={cn('flex flex-row', className)}>
        <div>
          <Select onValueChange={handleSetPool}>
            <SelectTrigger className="rounded-none border-0 bg-inherit  p-8 text-sm font-bold  hover:bg-black-2 hover:text-white ">
              <SelectValue placeholder="Privacy Pool" />
            </SelectTrigger>
            <SelectContent>
              {getSupportedChains().map((chain) => {
                return (
                  <SelectGroup>
                    <SelectLabel>{chain}</SelectLabel>
                    {getPoolsforChain(chain).map((pool) => {
                      return <SelectItem value={pool}>{pool}</SelectItem>;
                    })}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select onValueChange={UpdateCurrentASP}>
            <SelectTrigger className="rounded-none border-0 bg-inherit p-8 text-sm font-bold hover:bg-black-2  hover:text-white ">
              <SelectValue placeholder="ASP" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Array.from(ASPList.values())
                  .map((asp) => asp.name)
                  .map((asp) => {
                    return <SelectItem value={asp}>{asp} ASP </SelectItem>;
                  })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSaveAccountState}
                  className="rounded-none border-0  bg-inherit p-8 text-sm  font-bold text-inherit   hover:text-white "
                >
                  Save State
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Account locally</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleAddPrivacyKey}
                  className="rounded-none border-0 bg-inherit p-8 text-sm font-bold text-inherit  hover:text-white "
                >
                  + Privacy Key
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate privacy key</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  };

  const UpdatePublicVal = (output: bigint[], input: bigint[]) => {
    try {
      let outputSum = output.reduce((acc, value) => acc + value, 0n);
      let inputSum = input.reduce((acc, value) => acc + value, 0n);
      let delta = outputSum - inputSum;
      setPublicVal(delta);
      setCommitFeeValue(delta);

      if (delta < 0) {
        setIsCommit(false);
      }
    } catch (e) {
      throw new Error('Invalid values set');
    }
  };

  const UpdateCurrentASP = (asp: string) => {
    setCurrentASP(asp);
  };

  const setCommitFeeValue = (publicVal: bigint) => {
    if (currentASP === '') {
      return 0.0;
    }

    // get fee val from ASP
    if (!ASPList.has(currentASP)) {
      throw new Error('ASP not found');
    }

    let aspSpec = ASPList.get(currentASP);
    if (aspSpec === undefined) {
      throw new Error('ASP not found');
    }

    let fee = aspSpec.commitFee;
    let feeVal = (publicVal * BigInt(fee * 1000)) / 1000n;
    console.log('publicVal ', publicVal, ' fee', fee, ' fee * 1000', fee * 1000, ' feeVal', feeVal);
    setFeeVal(feeVal);
  };

  return (
    <div className="h-screen bg-page-background">
      <div
        className="absolute z-30 flex h-full w-full flex-col items-center justify-center rounded-xl border-b bg-page-background  shadow-2xl"
        style={{ visibility: isAccountLoaded ? 'hidden' : 'visible' }}
      >
        <div className="flex flex-col gap-6 rounded-xl border-b bg-card-background px-10 py-10 text-blue shadow-2xl">
          <div className="flex flex-col gap-4">
            <h2 className="mb-10 text-4xl font-bold text-black">Welcome To Privacy Pool</h2>
            <h2 className="text-xl font-semibold underline decoration-1 underline-offset-4">
              Privacy Pool is an open, permisionless, privacy protocol for the EVM.
            </h2>
            <h2 className="mb-10 text-xl font-bold underline decoration-1 underline-offset-4">
              A collaboration with OxBow to explore compliant privacy protocols.
            </h2>

            <h2 className="text-lg font-semibold leading-relaxed">
              To interact with privacy pools, please create or import a local account ↓
            </h2>
          </div>

          <div className="mb-10 mt-6 flex">
            <label
              {...getRootProps()}
              className="flex h-full w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-page-background py-6 hover:bg-gray-100 "
            >
              <div className=" text-center">
                <div className=" mx-auto max-w-min rounded-md border p-2">
                  <Upload size={64} />
                </div>
                <p className="mt-2 text-2xl text-gray-600">
                  <span className="font-semibold">Drop file here</span>
                </p>
                <p className="text-xl text-gray-500">Or click to import account from file</p>
              </div>
            </label>
          </div>

          <div className="flex place-self-end">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCreateAccount}
                    className="rounded-3xl bg-blue p-6 text-lg font-semibold text-white"
                  >
                    <UserRoundPlus className="mr-2 h-10 w-10" /> Create New Account
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create & exports Account</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className=" flex h-full flex-col items-start bg-white">
        <div className="mx-4 my-4 flex w-full flex-row items-center">
          <div className="flex flex-row items-center">
            <div className="">
              <Image src={privacyPoolsLogo} alt="Privacy Pool Logo" className="h-20 w-20" />
            </div>
            <div className="mx-4">
              <h2 className=" text-5xl font-bold ">Privacy Pool</h2>
            </div>
          </div>
        </div>

        <div className="relative mb-20 grid h-full w-full grid-cols-9 grid-rows-6 gap-x-6 border-b border-t border-black-2 bg-inherit ">
          <div
            className=" relative col-span-7 row-span-6 flex flex-col items-end border-r border-black-2"
            ref={containerRef}
          >
            {TxRecordBuilder('relative px-6', TxRecordRef)}
          </div>
          <div className="relative col-span-2 row-span-6 flex flex-col px-6 py-6">
            <h2 className="text-dark-2 text-3xl font-bold"> Privacy Pool </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
