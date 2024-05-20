'use client'

import { useEffect, useState } from 'react'
import { cn } from "@/lib/utils";
import DotPattern from "@/components/magicui/dot-pattern";
import {CTX} from './components/ctx'

import privacyPoolsLogo from '@images/privacy-pools-logo.svg'
import Image from 'next/image'

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
  


export default function AppPage() {
    return (
    <div className="h-screen">
        <div className="flex justify-center items-center w-full h-full"> 
            <DotPattern
                className={cn(
                "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
                )}/>
            <div className="flex-column w-full max-w-xl z-0 p-4 overflow-hidden rounded-[40px] border-b shadow-[0_7px_50px_0_rgba(0,0,0,0.10)]">
                <div className="grid gap-1 grid-cols-4 pb-4 border-b w-full">
                    <div >
                        <Image src={privacyPoolsLogo} alt="Privacy Pools Logo" className="" />
                        <h2 className="text-2xl font-semibold tracking-tight pt-1">
                            Privacy Pools 
                        </h2>
                    </div>
                </div>

                <Tabs defaultValue="utxo" className="w-full max-w-xl" >
                    <TabsList className="grid w-full grid-cols-2" >
                        <TabsTrigger value="utxo" >State</TabsTrigger>
                        <TabsTrigger value="help">Help</TabsTrigger>
                    </TabsList>
                    <TabsContent value="utxo">
                        <CTX />
                    </TabsContent>
                </Tabs> 
            </div>
        </div>
    </div>
    )
}