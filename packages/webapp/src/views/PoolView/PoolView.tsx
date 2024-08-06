"use client"

import React, { useState } from "react"
import { SettingsDrawer } from "@/views/PoolView/sections/SettingsDrawer.tsx"
import { PoolTabs, TabsValue } from "@/views/PoolView/sections/PoolTabs.tsx"
import { PoolHeader } from "@/components/PoolHeader/PoolHeader.tsx"

export const PoolView = () => {
  const [currentTab, setCurrentTab] = useState<TabsValue>(TabsValue.Account)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="bg-page-background min-w-screen w-full min-h-screen h-full">
      <div className="grid grid-cols-2 items-center justify-center p-6 tablet:grid-cols-6 laptop:grid-cols-6 2xl:grid-cols-12">
        <div className="flex flex-col gap-y-5 col-span-2 tablet:col-start-1 tablet:col-span-6 laptop:col-span-4 laptop:col-start-2 2xl:col-span-6 2xl:col-start-4">
        <PoolHeader />
          <PoolTabs
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            onSettingsClick={() => setSettingsOpen(true)}
          />
          <SettingsDrawer
            isOpen={isSettingsOpen}
            onOpenChange={setSettingsOpen}
            className=""
          />
        </div>
      </div>
    </div>
  )
}
