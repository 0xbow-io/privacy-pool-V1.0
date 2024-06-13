'use client';

import WelcomeSection from '@sections/welcome/welcome';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DotPattern from '@/components/magicui/dot-pattern';


import React, { useState, useCallback } from 'react';
import { Upload, UserRoundPlus, Plus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  Select,
  SelectGroup,
  SelectLabel,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from "@/components/ui/select"


import { useKeyStore } from '@/providers/key-store-provider'


export default function Home() {

  const { 
      keys, 
      notEmpty, 
      generate, 

      availChains,
      avilPools,
      supportedUnitRepresentatives,
      currChain,
      currPool,
      currUnitRepresentative,


      importFromJSON, 
      exportToJSON, 
      avilCommits, 
      inCommits,
      inValues, 
      outValues,
      updateInValue } = useKeyStore(
    (state) => state,
  )

  // on file drop to load local account
  const onDrop = useCallback(async (acceptedFiles: File[]) => {

    const fileReader = new FileReader();

    if (acceptedFiles[0]) {
      fileReader.readAsText(acceptedFiles[0], 'UTF-8');
      fileReader.onload = (d) => {
        if (d.target === null) {
          throw new Error('Failed to read file');
        }
        if (d.target.result) {
          const content = d.target.result;
          importFromJSON(content.toString());
        } else {
          throw new Error('Failed to read file');
        }
      };
    }
  }, []);

  const { getRootProps } = useDropzone({ onDrop });


  const Render_Header = (className: string) => {
    return (
      <div className="flex flex-col ">
        <div className="grid grid-rows-2  grid-cols-2 gap-5 p-8 bg-blackmail shadow-md shadow-blackmail text-ghost-white">
          <div className="row-start-1 z-10 col-start-1 ">
            <h2 className="text-9xl font-bold">Privacy</h2>
          </div>
          <div className="row-start-2 z-10  col-start-1">
            <h2 className="text-9xl font-bold "> Pool </h2>
            </div>
          </div>           
        <div className="z-10 w-full flex flex-row rounded-br-xl border-t-2 border-t-blackmail bg-royal-nightfall justify-end">
          <div className = "flex flex-row items-center gap-x-4 ">
              <div className="flex-auto"> 
                <Label className='text-ghost-white'>Choose Pool: </Label>
              </div>
              <div className="flex-auto flex-col space-y-1.">
                <Select
                  value={currPool.id}
                  onValueChange={(value) => updateInValue(0, value)}
                >
                  <SelectTrigger id="input_commitment_1" className="bg-royal-nightfall text-ghost-white border-0  underline decoration-1 underline-offset-4">

                    <SelectValue placeholder="Select">
                      {currPool.id}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent position="popper" className="bg-royal-nightfall text-ghost-white ">
                  {
                    availChains.map((chain) => {
                      return (
                        <SelectGroup key={chain.name}>
                          <SelectLabel>{chain.name}</SelectLabel>
                          {avilPools.get(chain)!.map((pool) => {
                            return <SelectItem key={ pool.chain.name + ':' + pool.id} value={ pool.chain.name + ':' + pool.id}>{pool.id}</SelectItem>;
                          })}
                          <SelectSeparator />
                        </SelectGroup>
                      );
                    })
                  }
                  </SelectContent>
                </Select>
              </div>
          </div>
          <div className="relative flex flex-row ">
            <Button onClick={() => void generate()} className="items-left p h-full w-full justify-start rounded-none border-0 pl-0  font-semibold text-ghost-white bg-royal-nightfall hover:text-royal-nightfall hover:bg-ghost-white">
              <UserRoundPlus className="mx-4 size-6" /> New Account
            </Button>
          </div>
          <div
            {...getRootProps()}
            className="relative flex flex-row "
          >
            <Button className="items-left p h-full w-full justify-start rounded-none border-0 pl-0 font-semibold text-ghost-white bg-royal-nightfall hover:text-royal-nightfall hover:bg-ghost-white ">
              <Upload className="mx-4 size-6" /> Load Account 
            </Button>
          </div>
        </div>
        <DotPattern className="absolute left-0 top-0"/>
      </div>
    )
  }

  const Render_WelcomeSection = (className: string) => {
    return  <WelcomeSection className={className}/>;
  };


  const Render_AccountCard = (className: string) => {
    return(
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Always keep your privacy keys safe
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">

          <Accordion type="single" collapsible>
          {keys.map((key) => {
            const jsonKey = key.asJSON;
            return(
              <AccordionItem key={jsonKey.pubAddr} value={jsonKey.pubAddr} className=" ">
                <AccordionTrigger className=" border-b border-blackmail px-2 text-blackmail hover:bg-toxic-orange">
                  Address: {jsonKey.pubAddr}
                </AccordionTrigger>
                <AccordionContent>

                <div className="relative grid grid-cols-1  items-start justify-start gap-y-4 text-wrap px-4 pt-10">
                  <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                    <div className="text-sm font-bold text-blackmail">
                      <h2> privateKey: </h2>
                    </div>
                    <div>
                      <h2 className="text-sm  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                        {jsonKey.privateKey}
                      </h2>
                    </div>
                  </div>

                  <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                    <div className="text-sm font-bold text-blackmail">
                      <h2> keypair: </h2>
                    </div>
                    <div>
                      <h2 className="text-sm  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                        {jsonKey.keypair.privKey}
                      </h2>
                    </div>
                    <div>
                      <h2 className="text-sm  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                        {jsonKey.keypair.pubKey}
                      </h2>
                    </div>
                  </div>

                  <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                    <div className="text-sm font-bold text-blackmail">
                      <h2> encryption keys: </h2>
                    </div>
                    <div>
                      <h2 className="text-sm  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                        {jsonKey.ek_x}
                      </h2>
                    </div>
                    <div>
                      <h2 className="text-sm  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                        {jsonKey.ek_y}
                      </h2> 
                    </div>
                  </div>
                </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
          </Accordion>
        </CardContent>

        <CardFooter>
            <div
            className={cn(
              'relative flex w-full flex-row items-center justify-end gap-x-4 text-blackmail duration-300 ease-in',
              className,
            )}
          >
            <div className="flex flex-row  border-b-2 border-b-blackmail">
              <Button
                onClick={generate}
                className="w-full rounded-none border-0 bg-doctor text-lg  font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
              >
                Add Key
              </Button>
            </div>
            <div className="flex flex-row  border-b-2 border-b-blackmail">
              <Button
                onClick={() => exportToJSON(true)}
                className="w-full  rounded-none border-0 bg-doctor text-lg font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
              >
                Export Keys
              </Button>
            </div>
          </div>
        </CardFooter>
    </Card>
    )
  };

  const PublicValContainer = (className?: string) => {
    return (
      <div
        id={'extValContainer'}
        className={cn(
          'relative grid h-full w-full grid-cols-1 grid-rows-4 items-center justify-between gap-y-2 duration-300 ease-in',
          className,
        )}
      >
        <div className="border-b-2 border-blackmail pb-2">
          <label className="text-xl font-semibold"></label>
        </div>
        <div className="place-self-end ">
          <h2 className="text-xl font-semibold"> {inValues[0].toString()} {currUnitRepresentative.ticker} </h2>
        </div>
        <div className="place-self-end ">
          <h2 className="text-xl font-semibold"> {inValues[1].toString()}   {currUnitRepresentative.ticker} </h2>
        </div>
        <div className=" place-self-end border-b-2 border-doctor">
          <div className="flex flex-row items-center justify-center">
            <div>
              <input
                type="number"
                placeholder="Enter Public Value"
                className="rounded-none  border-0 border-b-2	border-blackmail bg-doctor px-0  text-end text-xl font-semibold text-blackmail  placeholder:text-blackmail"
              />
            </div>
            <div>
              <Plus className="size-6 stroke-blackmail" />
            </div>
          </div>
        </div>
      </div>
    );
  };


  const Render_TransactCard = (className: string) => {
    return(
      <Card className={cn("", className)}>
        <CardHeader className="">
          <CardTitle className=" py-6 border-t-4 border-r-4 border-blackmail">Computing Commitments & Releases</CardTitle>
          <CardDescription className="font-bold text-blackmail">

            <Accordion type="single" collapsible>
                <AccordionItem key='how_it_works' value='how_it_works' className=" ">
                  <AccordionTrigger className=" border-b border-blackmail px-2 text-blackmail hover:bg-toxic-orange">
                    How does it work?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className='flex flex-row relative p-6'> 
                      <div className='flex-auto'>
                        <p>
                          Privacy Pool utilises a 2 Inputs to 2 Outputs transaction scheme where you are computing two <span className='text-toxic-orange'> new commitments </span> from two commitments that you own.
                          A commitment is an encrypted value represented by an entry (commitment hash) in the Pool`&apos;`s Merkle Tree. <span className='text-toxic-orange'> Dummy input commitments </span>  has 0 value and does not exists in the Pool`&apos;`s Merkle Tree. 
                          It is used as a placeholder for when you don`&apos;`t want to use an existing commitment. <br/><br/>
                          Total sum  of the output commitment values need to match the sum of the input commitment values + public value.  
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
            </Accordion>
          
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
 
            <div className="flex flex-col relative">
              
              <div className ="flex  flex-row relative">

                <div className="flex-auto flex-col space-y-1.5">
                  <Label htmlFor="input_commitment_1">(1) Input Commitment</Label>
                  <Select
                    value={inCommits[0]}
                    onValueChange={(value) => updateInValue(0, value)}
                  >
                    <SelectTrigger id="input_commitment_1">
                      <SelectValue placeholder="Select">
                        {inCommits[0]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent position="popper">
                    {avilCommits.map((commit) => {
                      return (
                        <SelectItem key={commit.hash} value={'0x'+commit.hash.toString(16)}>
                        0x{commit.hash.toString(16)}
                        </SelectItem>
                      )
                    })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-auto flex-col space-y-1.5">
                  <Label htmlFor="input_commitment_2">(2) Input Commitment</Label>
                  <Select
                    value={inCommits[1]}
                    onValueChange={(value) => updateInValue(1, value)}
                  >
                    <SelectTrigger id="input_commitment_2">
                      <SelectValue placeholder="Select">
                        {inCommits[1]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent position="popper">
                    {avilCommits.map((commit) => {
                      return (
                        <SelectItem key={commit.hash} value={'0x'+commit.hash.toString(16)}>
                        0x{commit.hash.toString(16)}
                        </SelectItem>
                      )
                    })}
                    </SelectContent>
                  </Select>
                </div>

              </div>

              <div className ="grid grid-cols-2 relative items-start">
                <div className="flex-auto pl-8 pt-8">
                  <ul className="list-decimal">
                    <li>Choose Input Commitments. </li>
                    <li>Set Public Value to reach desired total output amount. </li>
                    <li>Adjust output amounts as desired. </li>
                    <li>Click on Compute to generate & verify zk-proof & execute commitment on-chain.</li>
                  </ul>
                </div>
                <div className="flex-auto">
                  {PublicValContainer('')}
                </div>
              </div>


            </div>


        </CardContent>
        <CardFooter>
            <div
            className={cn(
              'relative flex w-full flex-row items-center justify-end gap-x-4 text-blackmail duration-300 ease-in',
              className,
            )}
          >
            <div className="flex flex-row  border-b-2 border-b-blackmail">
              <Button
                onClick={generate}
                className="w-full rounded-none border-0 bg-doctor text-lg  font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
              >
                Compute
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    )
  }



  const Render_AppTabs = (className: string) => {
    return (
      <Tabs defaultValue="account" className={cn("flex flex-col z-10", className)}>

      <TabsList className="grid w-full grid-cols-4 bg-blackmail text-ghost-white font-bold">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="compute">Compute</TabsTrigger>
        <TabsTrigger value="asp">ASP</TabsTrigger>
        <TabsTrigger value="records">Records</TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        {Render_AccountCard('bg-doctor')}
      </TabsContent>

      <TabsContent value="compute">
        {Render_TransactCard('bg-doctor')}
      </TabsContent>

      </Tabs>
    )
  };

  return (
    <div className="h-screen w-screen bg-page-background">
      <div className="flex flex-col"> 
        <div className="grid grid-cols-4 m-4 gap-4 justify-items-center">
          <div className="relative col-span-2 col-start-2"> 
            <div className="relative flex flex-col gap-y-5 ">
              {Render_Header('')}
              {Render_WelcomeSection(notEmpty() ? 'hidden' : 'visible')}
              {Render_AppTabs(notEmpty() ? 'visible' : 'hidden')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
