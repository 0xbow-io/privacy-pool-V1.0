'use client';

import WelcomeSection from '@sections/welcome/welcome';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


import React, { useState, useCallback } from 'react';
import { Upload, UserRoundPlus, Plus, ChevronsUpDown, ChevronRightSquareIcon, X } from 'lucide-react';
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


import { useMediaQuery } from "@/hooks/use-media-query"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"



import { useKeyStore } from '@/providers/key-store-provider'


export default function Home() {

  const [open, setOpen] = React.useState(false)
  
  const [inputsIsOpen, setInputIsOpen] = React.useState(false)
  const [inputSheetIsOpen, setInputSheetOpen] = React.useState(false)
  const [ouptutsIsOpen, setOutputsIsOpen] = React.useState(false)

  const [tabsValue, setTabsValue] = React.useState('account')
  const isNotMobile = useMediaQuery("(min-width: 768px)")

  const { 
      keys, 
      notEmpty, 
      generate, 

      availChains,
      avilPools,
      getCurrentPool,
      currUnitRepresentative,

      updateTargetPoolChain,


      importFromJSON, 
      exportToJSON, 

      avilCommits, 
      inCommits,

      inValues, 
      outValues,
 

      updateInValue,
      udpatePublicValue,
      udpateOutputSplit,
      udpateOutputValue,
      updateOutputPrivacyKey,

      getOutputValue,
      getTotalOutputValue,
      getOutputSplit,
      getOutputPubKeyHash,

    } = useKeyStore(
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
  }, [importFromJSON]);

  const { getRootProps } = useDropzone({ onDrop });


  const SettingsSection = (className: string) => {
    return(
      <div className={cn("flex flex-col px-6 gap-4", className)}>
        <div className = "flex flex-row gap-x-4 items-center justify-items-center">
            <div className=""> 
              <h2 className='text-blackmail font-semibold text-md'>Choose Pool:</h2>
            </div>
            <div className="flex-auto flex-col space-y-1.5">
              <Select
                value={getCurrentPool().id}
                onValueChange={(value) => updateTargetPoolChain(value)}
              >
                <SelectTrigger id="input_commitment_1" className="bg-royal-nightfall text-ghost-white border-0  underline decoration-1 underline-offset-4 text-xs laptop:text-base ">
                  <SelectValue placeholder="Select">
                    {getCurrentPool().id}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent position="popper" className="bg-royal-nightfall text-ghost-white">
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
      
        <div className="flex-auto flex flex-row ">
          <div
            {...getRootProps()}
            className="flex-auto flex flex-row "
          >
            <Button onClick={() => {setOpen(false)}} className=" text-blackmail bg-ghost-white hover:text-ghost-white hover:bg-blackmail">
              <Upload className="mx-4 size-6" /> Load Account 
            </Button>
          </div>
          <div className="flex-auto flex flex-row"> 
            <Button onClick={() => {generate(); setOpen(false)}}  className=" text-blackmail bg-ghost-white hover:text-ghost-white hover:bg-blackmail">
            <UserRoundPlus className="mx-4 size-6" /> New Account
              </Button>
          </div>
        </div>
      </div>
    )
  }



  const Render_Header = (className: string) => {
    return (
      <div className="relative flex flex-row border-2 rounded-3xl bg-blackmail text-ghost-white py-3 pl-4">
          <div className="">
            <h2 className="text-2xl font-bold tablet:text-2xl air:text-2xl ">Privacy Pool</h2>
          </div>    
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
          <CardTitle>Privacy Keys:</CardTitle>
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
                <AccordionTrigger className=" border-b border-blackmail  text-blackmail hover:bg-toxic-orange text-xs">
                  {jsonKey.pubAddr}
                </AccordionTrigger>
                <AccordionContent>

                <div className="relative grid grid-cols-1  items-start justify-start gap-y-4 text-wrap pt-10">
                  <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                    <div className="text-xs font-bold text-blackmail">
                      <h2> privateKey: </h2>
                    </div>
                    <div>
                      <h2 className="text-xs text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                        {jsonKey.privateKey}
                      </h2>
                    </div>
                  </div>

                  <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                    <div className="text-xsfont-bold text-blackmail">
                      <h2> keypair: </h2>
                    </div>
                    <div>
                      <h2 className="text-xs  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                        {jsonKey.keypair.privKey}
                      </h2>
                    </div>
                    <div>
                      <h2 className="text-xs text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                        {jsonKey.keypair.pubKey}
                      </h2>
                    </div>
                  </div>

                  <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                    <div className="text-xsfont-bold text-blackmail">
                      <h2> encryption keys: </h2>
                    </div>
                    <div>
                      <h2 className="text-xs  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                        {jsonKey.ek_x}
                      </h2>
                    </div>
                    <div>
                      <h2 className="text-xs  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
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

  const Inputs_Dialog = (className: string) => {
    return(
      <Dialog open={inputSheetIsOpen} onOpenChange={setInputSheetOpen}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle>Choose an Input Commitment</DialogTitle>
            <DialogDescription>
              Select an existing unused commitment or a dummy commitmnet. 
            </DialogDescription>
          </DialogHeader>

          <div className="flex-auto">
            <Select
                value={inCommits[0]}
                onValueChange={(value) => updateInValue(0, value)}
              >
                <SelectTrigger>
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
          
        </DialogContent>
      </Dialog>
    )
  }

  const Iputs_Collapsible = (className: string) => {
    return(
        <Collapsible
          open={inputsIsOpen}
          onOpenChange={setInputIsOpen}
          className={cn("space-y-2", className)}
        >
          <div className="flex items-center justify-between space-x-4">
            <h2 className="text-sm font-semibold">
              Input Commitments:
            </h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className="rounded-md border px-4 py-3 text-sm">
            <h2 className="font-semibold  text-sm">Total: {getTotalOutputValue().toString()} {currUnitRepresentative.ticker} </h2>
          </div>
          <CollapsibleContent className="space-y-2">
            {
              inValues.map(
                (value, index) => {
                  return (
                    <div key={"invalue:"+index} className="rounded-md border px-4 py-3 text-sm items-center justify-between flex flex-row w-full">
                      <h2 className="font-semibold">Input ({index}): {value.toString()} {currUnitRepresentative.ticker}</h2>
                        <Button onClick={() => void setInputSheetOpen(true)} variant="ghost" size="sm" className="w-9 p-0">
                          <ChevronRightSquareIcon className="size-6" />
                        </Button>
                    </div>
                  )
                }
              )
            }
          </CollapsibleContent>
        </Collapsible>
    )
  }


  const Outputs_Collapsible = (className: string) => {
    return(
        <Collapsible
          open={ouptutsIsOpen}
          onOpenChange={setOutputsIsOpen}
          className={cn("space-y-2", className)}
        >
          <div className="flex items-center justify-between space-x-4">
            <h2 className="text-sm font-semibold">
              Output Commitments:
            </h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className="rounded-md border px-4 py-3 text-sm">
            <h2 className="font-semibold  text-sm">Total: {getTotalOutputValue().toString()} {currUnitRepresentative.ticker} </h2>
          </div>
          <CollapsibleContent className="space-y-2">
            {
              outValues.map(
                (value, index) => {
                  return (
                    <div key={"outValue:"+index} className="rounded-md border px-4 py-3 text-sm items-center justify-between flex flex-row w-full">
                      <h2 className="font-semibold">Output ({index}): {value.toString()} {currUnitRepresentative.ticker}</h2>
                        <Button onClick={() => void setInputSheetOpen(true)} variant="ghost" size="sm" className="w-9 p-0">
                          <ChevronRightSquareIcon className="size-6" />
                        </Button>
                    </div>
                  )
                }
              )
            }
          </CollapsibleContent>
        </Collapsible>
    )
  }


  const Render_TransactCard = (className: string) => {
    return(
      <Card className={cn("", className)}>

        <CardHeader className="">
          <CardTitle className="pt-6 border-t-2  border-blackmail text-xl font-bold">Compute Commitments & Releases</CardTitle>
          <CardDescription className="font-bold text-blackmail"> 

            <div className="flex-auto">
              <Accordion type="single" collapsible>
                <AccordionItem key='how_it_works' value='how_it_works' className=" ">
                  <AccordionTrigger className="mt-4 border border-blackmail px-2  hover:bg-toxic-orange">
                    <h2 className="text-blackmail "> How does it work? </h2>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className='flex flex-row relative p-6'> 
                      <div className='flex-auto'>
                        <p>
                          Privacy Pool utilises a 2 Inputs to 2 Outputs transaction scheme where you are computing two <span className='text-toxic-orange'> new commitments </span> from two commitments that you own.
                          A commitment is an encrypted value represented by an entry (commitment hash) in the Pool&apos;s Merkle Tree. <span className='text-toxic-orange'> Dummy input commitments </span>  has 0 value and does not exists in the Pool&apos;s Merkle Tree. 
                          It is used as a placeholder for when you don&apos;t want to use an existing commitment. <br/><br/>
                          Total sum  of the output commitment values need to match the sum of the input commitment values + public value.  
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div> 
          
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">

          <div className='flex flex-col gap-y-4'>
            <div className='flex-auto'>
              {Iputs_Collapsible('')}
            </div>
            <div className="flex-auto flex flex-col gap-y-4 ">
              <div>
                <h2 className="text-sm font-semibold">
                  Extra Amount:
                </h2>              
              </div>
              <input
                type="number"
                placeholder="Enter Amount"
                onChange={(e) => udpatePublicValue(Number(e.target.value))}
                className="px-4 py-3 text-sm"
              />
            </div>
            <div className='flex-auto'>
              {Outputs_Collapsible('')}
            </div>
          </div>

        </CardContent>
        <CardFooter className="mt-4">
            <div
            className={cn(
              'relative flex flex-col gap-4 text-blackmail duration-300 ease-in',
              className,
            )}
          >
            <div className="flex-auto">
              <Button
                onClick={generate}
                className="w-full rounded-none border-2 border-blackmail bg-doctor text-lg  font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
              >
                Compute
              </Button>
            </div>

            
          </div>
        </CardFooter>

      </Card>
    )
  }


  const Render_SettingsDrawer = (className: string) => {
    return(
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Load or create a new Account and select a Pool to interact with.
            </DrawerDescription>
          </DrawerHeader>
          {SettingsSection('')}
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button  onClick={() => setTabsValue(tabsValue)} variant="outline">Done</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
    </Drawer>
    )
  }

  const Render_DialogDrawer = (className: string) => {
    return(
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Load or create a new Account and select a Pool to interact with
            </DialogDescription>
          </DialogHeader>
          {SettingsSection('')}
        </DialogContent>
      </Dialog>
    )
  }


  const Render_AppTabs = (className: string) => {
    return (
      <div className={cn("relative", className)}>
          <Tabs value={tabsValue}>
            <div className="flex flex-row gap-x-1 items-start max-phone:flex-col max-phone:gap-y-4">
              <TabsList className="relative flex flex-col items-start w-fit text-blackmail bg-doctor h-fit mt-2 p-4 max-phone:flex-row max-phone:p-2 max-phone:mt-0 max-phone:w-full max-phone:justify-around  " >
                <TabsTrigger onClick={() => setTabsValue('account')} value="account" className='text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white'>Account</TabsTrigger>
                <TabsTrigger disabled={!notEmpty()} onClick={() => setTabsValue('compute')} value="compute" className='text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white'>Compute</TabsTrigger>
                <TabsTrigger disabled={!notEmpty()} onClick={() => setTabsValue('asp')} value="asp" className='text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white'>ASP</TabsTrigger>
                <TabsTrigger disabled={!notEmpty()} onClick={() => setTabsValue('records')} value="records" className='text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white'>Records</TabsTrigger>
                <TabsTrigger  onClick={() => setOpen(true)} value="settings" className='text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white'>Settings</TabsTrigger>
              </TabsList>
              <div>
                <TabsContent value="account">
                  { notEmpty() ?   Render_AccountCard('bg-doctor') : Render_WelcomeSection('') }
                </TabsContent>
                <TabsContent value="compute">
                  {Render_TransactCard('bg-doctor')}
                </TabsContent>
              </div>
            </div>
          </Tabs>
          {Inputs_Dialog('absolute')}
      </div>
    )
  };

  return (
    <div className="bg-page-background min-w-screen w-full min-h-screen h-full">
      <div className="grid grid-cols-2 items-center justify-center p-6 tablet:grid-cols-6 laptop:grid-cols-12">
        <div className="flex flex-col gap-y-5 col-span-2  tablet:col-start-2 tablet:col-span-4 laptop:col-span-6 laptop:col-start-4">
            {Render_Header('flex-auto ')}
            {Render_AppTabs('flex-auto z-10')}
            {isNotMobile ? Render_DialogDrawer('') : Render_SettingsDrawer('')}
        </div>
      </div>
    </div>
  );
}
