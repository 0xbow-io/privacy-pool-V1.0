
'use client'

import privacyPoolsLogo from '@images/privacy-pools-logo.svg'
import { KeyRound, Upload, Pickaxe} from "lucide-react"
import Image from 'next/image'
import * as React from "react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  

import {Address} from 'viem'
import { ChainId } from '@/types/chain'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import {CustomUtxo} from '@core/utxo'

import { Keypair } from '@core/account'
// import { preparePOIInputs } from '@core/poi'
// prepareMembershipProof, prepareTransaction
//import { getUtxoFromKeypair } from '@/store/account'


import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
  } from "@/components/ui/dialog"



import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import {SelectPoolForm} from './pools'

const Association_Set_Providers = ['None', 'OxBow.io']


export function UTXO() {
    const [error, setError] = useState('')
    const [poolBalance, setPoolBalance] = useState(0)
    const [unspentUtxos, setUnspentUtxos] = useState<CustomUtxo[]>([]) 
    const [targetUTXO, setTargetUTXO] = useState<CustomUtxo | undefined>(undefined)
    const [targetUTXOBalance, setTargetUTXOBalance] = useState('0')
    const [amount, setAmount] = useState('')
    const [balance, setBalance] = useState('0')
    const [aspSource, setASPSource] = useState(1)

    const [keypair, setKeypair] = useState<Keypair | null>(null)
    const [isKeyGenerated, setIsKeyGenerated] = useState(false)

    const [curChainId, setCurChainId] = useState(0)

    const [targetPool, setTargetPool] = useState("0x8e3E4702B4ec7400ef15fba30B3e4bfdc72aBC3B")


    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <h2 className="text-2xl font-semibold tracking-tight pt-1">
                        Pool: {targetPool.slice(0, 6)}...{targetPool.slice(-4)}
                    </h2>
                </CardTitle>
                <CardDescription>
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
          
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">Choose Pool</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
                <DropdownMenuLabel>Pool Address</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={targetPool} onValueChange={setTargetPool}>
                <DropdownMenuRadioItem value="0x8e3E4702B4ec7400ef15fba30B3e4bfdc72aBC3B">ETH Pool</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
            </DropdownMenu>
            </CardContent>
            <CardFooter>
            </CardFooter>
        </Card>
    )
}
 