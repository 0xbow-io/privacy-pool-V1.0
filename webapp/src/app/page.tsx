'use client';

import WelcomeSection from '@sections/welcome/welcome';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DotPattern from '@/components/magicui/dot-pattern';


import React, { useState, useCallback } from 'react';
import { Upload, UserRoundPlus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { useKeyStore } from '@/providers/key-store-provider'


export default function Home() {

  const { keys, generate, importFromJSON, exportToJSON  } = useKeyStore(
    (state) => state,
  )

  // on file drop to load local account
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    /*
    const acc = new account();
    if (acc === null) {
      throw new Error('Failed to create account');
    } 
    */

    const fileReader = new FileReader();

    if (acceptedFiles[0]) {
      fileReader.readAsText(acceptedFiles[0], 'UTF-8');
      fileReader.onload = (d) => {
        if (d.target === null) {
          throw new Error('Failed to read file');
        }
        if (d.target.result) {
          const content = d.target.result;
          //handleCreateAccount(content.toString());
        } else {
          throw new Error('Failed to read file');
        }
      };
    }
  }, []);

  const { getRootProps } = useDropzone({ onDrop });


  function banner() {
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
      </div>
    )
  }
  return (
    <div className="h-screen w-screen bg-page-background">
      <div className="flex flex-col"> 
        <div className="grid grid-cols-4 m-4 gap-4 justify-items-center">
          <div className="relative col-span-2 col-start-2"> 
            <div className="relative flex flex-col gap-y-5 ">
              {banner()}
              <WelcomeSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
