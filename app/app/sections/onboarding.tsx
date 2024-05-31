import DotPattern from '@/components/magicui/dot-pattern';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { Upload, UserRoundPlus } from 'lucide-react';
import { account } from '@core/account';

import React, { useCallback } from 'react';

interface State {
  handleCreateAccount: (snapshotJSON: string) => void;
  className: string;
}

export default function OnboardingSection({ handleCreateAccount, className }: State) {
  // on file drop to load local account
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const acc = new account();
    if (acc === null) {
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
          handleCreateAccount(content.toString());
        } else {
          throw new Error('Failed to read file');
        }
      };
    }
  }, []);

  const { getRootProps } = useDropzone({ onDrop });

  const CreateNewAccountTrigger = () => {
    handleCreateAccount('');
  };

  return (
    <div
      className={cn(
        '3xl:col-span-4 3xl:col-start-3 group relative grid gap-x-4  xl:col-span-8 xl:col-start-3 xl:grid-cols-2 xl:grid-rows-1',
        className,
      )}
    >
      <div className=" relative flex flex-col gap-y-1">
        <div className="bg-dominant-blue  shadow-dominant-blue relative grid grid-cols-2 items-center justify-center gap-y-5  px-8 py-8 shadow-md transition-all duration-300 ease-in group-hover:-translate-y-20">
          <div className=" place-self-stat relative col-span-2 col-start-1 row-start-1 ">
            <h2 className="text-calming-white relative z-10 text-9xl font-bold">Privacy</h2>
          </div>
          <div className=" relative col-span-2 col-start-1 row-start-2 place-self-start duration-300  ease-in ">
            <h2 className="text-calming-white relative z-10 text-9xl font-bold sm:text-xl md:text-9xl ">
              Pool
            </h2>
          </div>
          <DotPattern className="absolute left-0 top-0 h-full w-full opacity-75" />
        </div>
        <div className="border-t-dominant-blue text-strong-blue group-hover:bg-strong-blue relative z-10 flex  w-full flex-col rounded-bl-xl  border-t-2 bg-page-background transition-all duration-300 ease-in group-hover:visible group-hover:-translate-y-20">
          <div
            {...getRootProps()}
            className="bg-calming-white rounded-3x relative flex h-full  place-self-end  "
          >
            <Button className="group-hover:bg-strong-blue group-hover:shadow-strong-blue items-left p group-hover:text-calming-white  h-full  w-full justify-start  rounded-none  border-0 bg-page-background pl-0 pr-10 text-lg font-semibold text-page-background transition-all duration-300 ease-in   ">
              <Upload className="fill-strong-blue invisible mx-4 size-6 group-hover:visible" />{' '}
              Click To Load Account
            </Button>
          </div>
        </div>
      </div>
      <div className=" relative flex flex-col">
        <div className="border-b-calming-white text-strong-blue group-hover:bg-strong-blue relative z-10 flex h-full w-full flex-col rounded-tr-xl  border-b-2 bg-page-background transition-all duration-300 ease-in  group-hover:translate-y-20">
          <div className="bg-calming-white rounded-3x relative flex h-full  ">
            <Button
              onClick={handleCreateAccount}
              className="group-hover:bg-strong-blue items-left   group-hover:text-calming-white group-hover:decoration-calming-white h-full w-full justify-start rounded-none border-0  bg-page-background  px-6 py-6  pr-10  text-lg font-semibold  text-page-background underline-offset-8 transition-all duration-300 ease-in group-hover:underline   "
            >
              <UserRoundPlus className="fill-strong-blue invisible mx-4 size-6 group-hover:visible" />{' '}
              Create New Account
            </Button>
          </div>
        </div>
        <div className="bg-dominant-blue shadow-dominant-blue group  relative grid grid-cols-2 items-center justify-center px-8 py-8 shadow-md transition-all duration-300 ease-in group-hover:translate-y-20">
          <div className="text-calming-white border-calming-white relative col-span-2 row-span-3 row-start-3 flex flex-col items-start justify-start border-l-2 px-10  ">
            <div className="relative flex ">
              <h2 className=" text-calming-white text-balance text-start  text-4xl font-bold leading-relaxed">
                Regulatory Compliant Privacy Protocol for the EVM
              </h2>
            </div>
            <div className=" = flex py-6 transition-all duration-300 ease-in">
              <p className=" text-calming-white z-10 text-pretty text-justify  text-lg leading-relaxed ">
                Privacy pools extends previous zero-knowledge proofs (ZKPs) privacy tools by
                allowing users to publicly publish an additional ZKP to prove that the funds they
                commit to the protocol are not associated with illicit funds from other users,
                helping to isolate illicit funds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
