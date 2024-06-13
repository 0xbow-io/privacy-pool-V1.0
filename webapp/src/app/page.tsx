'use client';

import WelcomeSection from '@sections/welcome/welcome';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DotPattern from '@/components/magicui/dot-pattern';


import React, { useState, useCallback } from 'react';
import { Upload, UserRoundPlus } from 'lucide-react';
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


import { useKeyStore } from '@/providers/key-store-provider'


export default function Home() {

  const { keys, notEmpty, generate, importFromJSON, exportToJSON  } = useKeyStore(
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
        <div className="grid grid-rows-2 gap-5 p-8 bg-blackmail shadow-md shadow-blackmail text-ghost-white">
          <div className="row-start-1 z-10 ">
            <h2 className="text-9xl font-bold">Privacy</h2>
          </div>
          <div className="row-start-2 z-10 ">
            <h2 className="text-9xl font-bold "> Pool </h2>
            </div>
          </div>           
        <div className="z-10 flex w-full flex-row rounded-br-xl border-t-2 border-t-blackmail bg-royal-nightfall  justify-end">
          <div className="relative flex flex-row ">
            <Button onClick={() => void generate()} className="items-left p h-full w-full justify-start rounded-none border-0 pl-0  text-lg font-semibold text-ghost-white bg-royal-nightfall hover:text-royal-nightfall hover:bg-ghost-white">
              <UserRoundPlus className="mx-4 size-6" /> New Account
            </Button>
          </div>
          <div
            {...getRootProps()}
            className="relative flex flex-row"
          >
            <Button className="items-left p h-full w-full justify-start rounded-none border-0 pl-0 text-lg font-semibold text-ghost-white bg-royal-nightfall hover:text-royal-nightfall hover:bg-ghost-white ">
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

  const Render_AppTabs = (className: string) => {
    return (
      <Tabs defaultValue="account" className={cn("flex flex-col z-10", className)}>

      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="Transact">Transact</TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        {Render_AccountCard('bg-doctor')}
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
