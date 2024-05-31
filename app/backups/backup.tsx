'use client';

import { FunctionMath } from '@carbon/icons-react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useEffect, useState, useCallback, forwardRef, useRef } from 'react';
import { cn } from '@/lib/utils';
import privacyPoolsLogo from '@images/privacy-pools-logo.svg';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { useXarrow, Xwrapper } from 'react-xarrows';
import Xarrow from 'react-xarrows';

import { ASPList } from '@core/asp';

import { Users2, Upload, UserRoundPlus, Plus } from 'lucide-react';

import DotPattern from '@/components/magicui/dot-pattern';

import { account, txRecord, NewCTX } from '@core/account';
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
  const [inputSum, setInputSum] = useState<bigint>(0n);
  const [inputCommitment2, setInputCommitment2] = useState('');
  const [inputCommitment2Value, setInputCommitment2Value] = useState<bigint>(0n);

  const [outCommitmentAmount1, setOutCommitmentAmount1] = useState('');
  const [outCommitmentPubkey1, setOutCommitmentPubKey1] = useState('0');
  const [outCommitmentAmount2, setOutCommitmentAmount2] = useState('');
  const [outCommitmentPubkey2, setOutCommitmentPubKey2] = useState('0');
  const [outCommitmentIndex1, setOutCommitmentIndex1] = useState<bigint>(0n);
  const [outCommitmentIndex2, setOutCommitmentIndex2] = useState<bigint>(0n);

  const [publicVal, setPublicVal] = useState<bigint>(0n);
  const [feeVal, setFeeVal] = useState<bigint>(0n);
  const [isValsValid, setIsValsValid] = useState<boolean>(false);

  // whether the computed Tx Record is a commitment or release;
  const [isCommit, setIsCommit] = useState<boolean>(true);
  const [currTxRecord, setTxRecord] = useState<txRecord | null>(null);

  const updateArrow = useXarrow();

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

  // set the target privacy pool
  const handleSetPool = async (poolIdentifier: string) => {
    setCurrentPool(poolIdentifier);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  function computeTxRecord() {
    if (currentAccount === null) {
      throw new Error('Account not loaded');
    }
    // needs poolID  to be set
    if (currentPool === '') {
      return;
    }

    // sync up pool information first
    let pool = getPoolFromIdentifier(currentPool);
    if (pool === undefined) {
      throw new Error('Failed to get pool ' + currentPool);
    }

    try {
      pool.state.syncCurrentOnChainRoot();
      pool.state.syncCurrentSize();
      pool.state.syncCurrentDepth();

      console.log('latest root: ', pool?.state.CurrentOnChainRoot());
      console.log('latest size: ', pool.state.CurrentOnChainSize());
      console.log('latest depth: ', pool?.state.CurrentOnChainDepth());

      let outPkHash1 = hexToBigInt(outCommitmentPubkey1 as Hex);
      let outPkHash2 = hexToBigInt(outCommitmentPubkey2 as Hex);

      let outPk1 = currentAccount.keypairFromPkHash(outPkHash1)?.pubKey;
      let outPk2 = currentAccount.keypairFromPkHash(outPkHash2)?.pubKey;
      if (outPk1 === null || outPk2 === null) {
        console.log('Failed to get keypair from pubkey');
        throw new Error('Failed to get keypair from pubkey');
      }

      // verify the input commitments
      // check with account input commitment hash exists
      // if not, provide account with a keypair for it to generate virtual ctxs
      let inCtxHash1 =
        inputCommitment1 !== 'virtual' ? hexToBigInt(('0x' + inputCommitment1) as Hex) : BigInt(0);
      let inCtxHash2 =
        inputCommitment2 !== 'virtual' ? hexToBigInt(('0x' + inputCommitment2) as Hex) : BigInt(0);

      let inCtxs = [
        currentAccount.FetchCTX(currentPool, inCtxHash1, outPk1, 0n),
        currentAccount.FetchCTX(currentPool, inCtxHash2, outPk2, 0n),
      ];

      let rec = new txRecord(
        inCtxs,
        [
          NewCTX(outPk1, BigInt(outCommitmentAmount1), pool.state.CurrentOnChainSize()),
          NewCTX(outPk2, BigInt(outCommitmentAmount2), pool.state.CurrentOnChainSize() + 1n),
        ],
        [currentAccount.signCTX(inCtxs[0]), currentAccount.signCTX(inCtxs[1])],
        BigInt(feeVal),
      );

      console.log('tx record: ', rec);

      setIsValsValid(true);
      setTxRecord(rec);
    } catch (e) {
      console.log('Failed to compute tx record ', e);
      return;
    }
  }

  function verifyTxRecordInputs(
    outVals: bigint[],
    outPks: bigint[],
    publicVal: bigint,
    feeVal: bigint,
  ) {
    if (currentAccount === null) {
      throw new Error('Account not loaded');
    }
    // needs poolID  to be set
    if (currentPool === '') {
      console.log('pool not set');
      return;
    }

    try {
      // output can't be negatives
      if (outVals[0] < 0n || outVals[1] < 0n) {
        console.log('output values cannot be negative');
        return;
      }

      // check that the output pub keys are valid and exists in account
      if (!currentAccount.hasKeyPair(outPks[0]) || !currentAccount.hasKeyPair(outPks[1])) {
        console.log('output pub keys are not valid');
        return;
      }
      setIsValsValid(true);
      console.log('output values and pub keys are valid');
    } catch (e) {
      return;
    }
  }

  function handleOutCommitmentKeyChoice(value: string, commitmentID: number) {
    let pubKeys = [0n, 0n];
    if (commitmentID === 1) {
      setOutCommitmentPubKey1('0x' + value);
      pubKeys[0] = hexToBigInt(('0x' + value) as Hex);
      pubKeys[1] = outCommitmentPubkey2 === '' ? 0n : hexToBigInt(outCommitmentPubkey2 as Hex);
    } else if (commitmentID === 2) {
      setOutCommitmentPubKey2('0x' + value);
      pubKeys[0] = outCommitmentPubkey1 === '' ? 0n : hexToBigInt(outCommitmentPubkey1 as Hex);
      pubKeys[1] = hexToBigInt(('0x' + value) as Hex);
    }

    verifyTxRecordInputs(
      [BigInt(outCommitmentAmount1), BigInt(outCommitmentAmount2)],
      pubKeys,
      publicVal,
      feeVal,
    );
  }

  function GetOutCommitmentValueString(id: number): string {
    return id === 1 ? outCommitmentAmount1 : outCommitmentAmount2;
  }

  function handleOutCommitmentAmntChange(event: React.ChangeEvent<HTMLInputElement>) {
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
    const { publicVal: publicVal, feeVal: feeVal } = UpdatePublicVal(newOuts, [
      inputCommitment1Value,
      inputCommitment2Value,
    ]);

    verifyTxRecordInputs(
      newOuts,
      [hexToBigInt(outCommitmentPubkey1 as Hex), hexToBigInt(outCommitmentPubkey2 as Hex)],
      publicVal,
      feeVal,
    );
  }

  function UpdatePublicVal(
    output: bigint[],
    input: bigint[],
  ): { publicVal: bigint; feeVal: bigint } {
    try {
      let outputCommitmentSum = output.reduce((acc, value) => acc + value, 0n);
      let inputCommitmentSum = input.reduce((acc, value) => acc + value, 0n);
      setInputSum(inputCommitmentSum);
      let delta = outputCommitmentSum - inputCommitmentSum;
      setPublicVal(delta);
      let feeVal = setCommitFeeValue(delta);

      if (delta < 0) {
        setIsCommit(false);
      }
      return { publicVal: delta, feeVal: feeVal };
    } catch (e) {
      throw new Error('Invalid values set');
    }
  }

  function UpdateCurrentASP(asp: string) {
    setCurrentASP(asp);
  }

  function setCommitFeeValue(publicVal: bigint): bigint {
    if (currentASP === '') {
      return 0n;
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
    return feeVal;
  }

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
        <SelectTrigger className=" border-font-color bg-font-color hover:text-font-color z-10 rounded-3xl border-2 px-6 text-lg font-bold  text-page-background duration-300 ease-in hover:bg-page-background">
          <SelectValue placeholder="Choose Account">
            {GetAccPublicAddrr().substring(0, 6)}...{GetAccPublicAddrr().substring(36, 42)}
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
  const AccSelectionCard = (className: string) => {
    return (
      <div
        id={'AccountCard'}
        className={cn(
          '3xl:col-span-4 3xl:col-start-3 group relative grid gap-x-4 xl:col-span-8  xl:col-start-3 xl:grid-cols-2 xl:grid-rows-1',
          className,
        )}
      >
        <div>
          <label className="text-2xl font-semibold">
            {publicVal >= 0 ? 'Commit With' : 'Release To'} :
          </label>
        </div>
        <div className="hover:bg-font-color relative col-span-2 rounded-3xl  font-semibold  hover:text-page-background">
          {AccountPrivKeyDropDown()}
        </div>
      </div>
    );
  };

  const ASPSelectionDropDown = () => {
    if (currentAccount === undefined) {
      return <div></div>;
    }
    return (
      <Select value={currentASP} onValueChange={(value) => UpdateCurrentASP(value)}>
        <SelectTrigger className="bg-font-color hover:text-font-color shadow-font-color relative rounded-3xl bg-inherit px-10 text-lg font-bold text-page-background shadow-none duration-300 ease-in hover:bg-page-background">
          <SelectValue placeholder="Select ASP">{currentASP}</SelectValue>
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

  // Card for creating the out commitment.
  const ASPSelectionCard = (className: string) => {
    return (
      <div
        id="ASPSelectionCard"
        className={cn(
          'relative grid grid-cols-3 items-center justify-evenly duration-300 ease-in',
          className,
        )}
      >
        <div className="relative col-span-2 grid grid-cols-3 items-center font-semibold text-inherit">
          <div>
            <label className="">Association Set Provider :</label>
          </div>
          <div className="bg-font-color relative col-span-2 rounded-3xl text-page-background">
            {ASPSelectionDropDown()}
          </div>
        </div>
        <div className="relative place-self-end self-center">
          <Button className="border-border-color hover:bg-font-color relative rounded-3xl  border-2 bg-page-background text-inherit duration-300 ease-in hover:text-page-background">
            <Users2 className="mr-4" /> View Association Set ⇨
          </Button>
        </div>
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
        <SelectTrigger className=" bg-font-color hover:text-font-color rounded-3xl text-lg font-bold text-page-background duration-300 ease-in hover:bg-page-background">
          <SelectValue placeholder="Encrypt with key 🔐">
            🔐 :{' '}
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
  const OutCommitmentCard = (className?: string, commitmentID?: number) => {
    if (commitmentID === undefined) {
      throw new Error('commitmentID not set');
    }
    return (
      <div
        id={'OutCommitmentCard' + commitmentID}
        className={cn(
          'text-font-color relative grid grid-cols-2  grid-rows-2 items-center justify-items-start text-sm duration-300 ease-in',
          className,
        )}
      >
        <div className="relative col-span-2 col-start-1 row-start-1 flex flex-row items-center justify-items-start">
          <div className="">
            <label className="mr-4">Output {commitmentID} :</label>
          </div>
          <div className="">
            <Input
              type="text"
              placeholder="Enter Amount"
              value={commitmentID === 1 ? outCommitmentAmount1 : outCommitmentAmount2}
              name={commitmentID.toString()}
              onChange={(e) => handleOutCommitmentAmntChange(e)}
              className="bg-font-color bg-opacity-60 text-xl font-bold text-page-background"
            />
          </div>
        </div>
        <div className="border-border-color relative col-span-2 w-full flex-row border-t-2 pt-4">
          <div className="">{OutCommitmentKeyDropDown(commitmentID)}</div>
        </div>
      </div>
    );
  };

  function HandleInputCommitmentChange(value: string, commitmentID: number) {
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
  }

  const PoolSelectionDropDown = () => {
    return (
      <Select onValueChange={handleSetPool}>
        <SelectTrigger className="rounded-none border-none bg-inherit text-lg font-bold ">
          <SelectValue placeholder="...."> {currentPool}</SelectValue>
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
    );
  };

  // Card for creating the out commitment.
  const PoolSelectContainer = (className: string) => {
    return (
      <div
        id="PoolSelectionContainer"
        className={cn(
          'relative flex flex-row items-center justify-between duration-300 ease-in',
          className,
        )}
      >
        <div className="">
          <label className="text-font-color text-xl font-bold">Select Privacy Pool :</label>
        </div>
        <div className="text-font-color hover:bg-font-color bg-page-background hover:text-page-background">
          {PoolSelectionDropDown()}
        </div>
      </div>
    );
  };

  const SaveStateContainer = (className: string) => {
    return (
      <div
        id="SaveStateContainer"
        className={cn(
          'justif-start text-font-color relative flex w-full  flex-row duration-300 ease-in',
          className,
        )}
      >
        <div>
          <Button
            onClick={handleSaveAccountState}
            className="text-font-color border-deep-oceanic hover:bg-font-color w-full rounded-none border-2 bg-page-background text-lg font-bold hover:text-page-background"
          >
            Save Account
          </Button>
        </div>
      </div>
    );
  };

  const GeneratePrivacyKeyContainer = (className: string) => {
    return (
      <div
        id="GeneratePrivacyKeyContainer"
        className={cn(
          'text-font-color relative  flex w-full flex-row  justify-start duration-300 ease-in',
          className,
        )}
      >
        <div>
          <Button
            onClick={handleAddPrivacyKey}
            className="text-font-color border-deep-oceanic hover:bg-font-color w-full rounded-none border-2 bg-page-background text-lg font-bold hover:text-page-background"
          >
            Add Privacy Key
          </Button>
        </div>
      </div>
    );
  };

  const InputCommitmentDropDown = (commitmentID: number) => {
    return (
      <Select
        value={commitmentID == 1 ? inputCommitment1 : inputCommitment2}
        onValueChange={(value) => HandleInputCommitmentChange(value, commitmentID)}
      >
        <SelectTrigger className="bg-text-colour items-center justify-start border-0 px-0 py-0 text-base font-bold text-page-background duration-300 ease-in focus:ring-page-background">
          <SelectValue placeholder="Select Commitment">
            {commitmentID == 1 ? inputCommitment1 : inputCommitment2}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="virtual">Virtual 0 ETH</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };

  // Card for creating the out commitment.
  const InputCommitmentCard = (className: string, commitmentID: number) => {
    return (
      <div
        id={'InputCommitmentCard' + commitmentID}
        className={cn(
          'relative grid h-full w-full grid-cols-1 grid-rows-2 items-start justify-between duration-300 ease-in',
          className,
        )}
      >
        <div className="">
          <label className="text-lg font-normal">({commitmentID}) Input Commitment: </label>
        </div>
        <div className=" place-self-end border-b-2 border-page-background">
          {InputCommitmentDropDown(commitmentID)}
        </div>
      </div>
    );
  };

  // Card for creating the out commitment.
  const InputSummaryCard = (className: string) => {
    return (
      <div id={'InputSummaryCard'} className={cn('relative duration-300 ease-in', className)}>
        <div className="relative grid h-full items-end justify-start">
          <div className="row-span-2"></div>
          <div className="flex flex-col gap-y-2">
            <label className="text-lg font-normal">Total Input </label>
            <h2 className="text-xl font-bold"> {inputSum.toString()} ETH </h2>
          </div>
        </div>
      </div>
    );
  };

  const GlobalAccountSection = (className: string) => {
    return (
      <div
        id="txRecordGrid"
        className={cn(
          ' text-font-color relative z-10 flex flex-col items-start justify-start rounded-tl-3xl bg-page-background duration-300 ease-in',
          className,
        )}
      >
        <div className=" border-border-color relative w-full  border-b-2 px-4 py-10">
          <h1 className={cn('text-5xl font-bold ')}>Account </h1>
        </div>
        <div className="text-font-color border-border-color relative w-full border-b-2 px-4 py-4">
          {PoolSelectContainer('pl-4')}
        </div>
        <div className="text-font-color border-border-color relative border-b-2 px-4 py-4">
          {ASPSelectionCard('text-lg text-font-color w-full')}
        </div>

        <div className="relative  items-center justify-between px-4 py-4">
          {GeneratePrivacyKeyContainer('   ')}
          {SaveStateContainer(' ')}
        </div>
      </div>
    );
  };

  const ExtValueContainer = (className?: string) => {
    return (
      <div
        id={'extValContainer'}
        className={cn(
          'relative grid h-full w-full grid-cols-1 grid-rows-4 items-center justify-between gap-y-2 duration-300 ease-in',
          className,
        )}
      >
        <div className="border-dominant-blue border-b-2 pb-2">
          <label className="text-xl font-semibold">Compute Output </label>
        </div>
        <div className="place-self-end ">
          <h2 className="text-xl font-semibold"> {inputCommitment1Value.toString()} ETH </h2>
        </div>
        <div className="place-self-end ">
          <h2 className="text-xl font-semibold"> {inputCommitment1Value.toString()} ETH </h2>
        </div>
        <div className=" place-self-end border-b-2 border-page-background">
          <div className="flex flex-row items-center justify-center">
            <div>
              <Plus className="stroke-dominant-blue size-10" />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Enter Extra Value"
                onChange={(e) => handleOutCommitmentAmntChange(e)}
                className="placeholder:text-dominant-blue  text-dominant-blue border-dominant-blue	focus:outline-cool-green rounded-none border-0  border-b-2 bg-page-background px-0 text-end  text-xl font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TxRecordSection = (className: string) => {
    return (
      <div
        id="txRecordGrid"
        className={cn(
          ' text-font-color relative flex flex-col items-start justify-start gap-4 rounded-xl bg-page-background  px-10  duration-300 ease-in',
          currentPool === '' ? 'z-10 blur-2xl' : ' ',
          className,
        )}
      >
        <div className="border-border-color flex h-full w-full border-b-4 py-10">
          <h1 className={cn('text-font-color text-5xl font-bold')}>
            Create {publicVal >= 0 ? 'Commit' : 'Release'}:
          </h1>
        </div>

        <div className=" relative grid grid-cols-3 grid-rows-8 gap-5 rounded-xl text-page-background">
          {InputCommitmentCard(
            '  px-4 py-4 border-2 border-font-color border-r-0 rounded-tl-xl bg-font-color row-span-3 col-start-1',
            1,
          )}
          {InputCommitmentCard(
            ' px-4 py-4 border-2 border-font-color border-r-0 bg-font-color row-span-3 col-start-2 ',
            2,
          )}
          {InputSummaryCard(
            'col-start-3 h-full row-span-5  px-4 py-4  border-2 border-font-color rounded-tr-xl bg-font-color ',
          )}
          {ExtValueContainer(
            'col-start-1 row-start-4 col-span-1 row-span-5 border-t-0 border-2 border-font-color bg-page-background px-6 py-6 text-strong-blue',
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-page-background">
      <div
        className="absolute z-30 flex h-full w-full flex-col items-center justify-center rounded-xl border-b bg-page-background shadow-2xl"
        style={{ visibility: isAccountLoaded ? 'hidden' : 'visible' }}
      >
        <div className="text-font-color flex flex-col gap-6 rounded-xl border-b bg-card-background px-10 py-10 shadow-2xl">
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
              <div className="text-center">
                <div className="mx-auto max-w-min rounded-md border-2 p-2">
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

      <div className="flex h-full flex-col items-start">
        <div className="mx-4 my-4 flex w-full flex-row items-center">
          <div className="flex flex-row items-center">
            <div className="">
              <Image src={privacyPoolsLogo} alt="Privacy Pool Logo" className="h-20 w-20" />
            </div>
            <div className="mx-4">
              <h2 className=" text-font-color text-5xl font-bold">Privacy Pool</h2>
            </div>
          </div>
        </div>
        <Xwrapper>
          <div className="relative mb-20 flex h-full w-full flex-row items-start justify-start gap-x-2 border-b border-t-2 border-black-2 bg-inherit px-4 py-4">
            {GlobalAccountSection('relative border-2 border-border-color min-h-full w-1/3')}
            {TxRecordSection('relative border-2 border-border-color rounded-3xl ')}
          </div>
        </Xwrapper>
      </div>
    </div>
  );
}
