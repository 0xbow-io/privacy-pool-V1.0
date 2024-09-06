"use client"

import React, { useState } from "react"
import { SettingsDrawer } from "@/views/PoolView/sections/SettingsDrawer.tsx"
import { PoolHeader } from "@/components/PoolHeader/PoolHeader.tsx"
import Footer from "@/components/Footer/Footer.tsx"
import { PoolTabs } from "@/views/PoolView/sections/PoolTabs.tsx"

export default function PoolView() {
  return (
    <div className="bg-page-background min-w-screen w-full min-h-screen h-full flex mb-12 flex-col">
      <div className="flex-grow">
        <div className="grid grid-cols-2 items-center justify-center p-6 tablet:grid-cols-6 laptop:grid-cols-6 2xl:grid-cols-12">
          <div className="flex flex-col gap-y-5 col-span-2 tablet:col-start-1 tablet:col-span-6 laptop:col-span-4 laptop:col-start-2 2xl:col-span-6 2xl:col-start-4">
            <PoolHeader />
            <PoolTabs />
            <SettingsDrawer />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
