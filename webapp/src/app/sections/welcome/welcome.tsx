import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { Upload, UserRoundPlus } from 'lucide-react';

import React, { useCallback } from 'react';
import DotPattern from '@/components/magicui/dot-pattern';


export function WelcomeSection() {

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

    return (
        <div className="relative flex flex-col gap-y-5 ">

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
                        <Button className="items-left p h-full w-full justify-start rounded-none border-0 pl-0  text-lg font-semibold text-ghost-white bg-royal-nightfall hover:text-royal-nightfall hover:bg-ghost-white">
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

            <div className="flex flex-col ">
                <div className="z-20 relative grid  grid-cols-2 items-center justify-center bg-blackmail px-8 py-8 shadow-md shadow-blackmail">
                    <div className="relative col-span-2 row-span-3 row-start-3 flex flex-col items-start justify-start border-l-2 border-ghost-white px-10 text-ghost-white  ">
                        <div className="relative flex ">
                            <h2 className=" text-balance text-start text-4xl  font-bold leading-relaxed text-ghost-white">
                                Regulatory Compliant Privacy Protocol for the EVM
                            </h2>
                        </div>
                        <div className="flex py-6">
                            <p className=" z-10 text-pretty text-justify text-lg  leading-relaxed text-ghost-white ">
                                Privacy pools extends previous zero-knowledge proofs (ZKPs) privacy tools by
                                allowing users to publicly publish an additional ZKP to prove that the funds they
                                commit to the protocol are not associated with illicit funds from other users,
                                helping to isolate illicit funds.
                                <br />
                                <br />
                                Click on the <span className='text-toxic-orange'> "Load Account" </span> button above to load an existing account or create a new one via <span className='text-toxic-orange'> "New Account" </span> 
                            </p>
                        </div>
                    </div>
                </div>       
            </div>
            <DotPattern className="absolute left-0 top-0 opacity-75" />
        </div>       
    );
}