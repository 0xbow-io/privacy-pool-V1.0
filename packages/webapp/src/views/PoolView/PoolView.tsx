"use client"

import React, { useState } from "react"
import { SettingsDrawer } from "@/views/PoolView/sections/SettingsDrawer.tsx"
import { PoolTabs, TabsValue } from "@/views/PoolView/sections/PoolTabs.tsx"

export const PoolView = () => {
  const [currentTab, setCurrentTab] = useState<TabsValue>(TabsValue.Account)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="bg-page-background min-w-screen w-full min-h-screen h-full">
      <div className="grid grid-cols-2 items-center justify-center p-6 tablet:grid-cols-6 laptop:grid-cols-12">
        <div className="flex flex-col gap-y-5 col-span-2  tablet:col-start-2 tablet:col-span-4 laptop:col-span-6 laptop:col-start-4">
          <div className="relative flex flex-row border-2 rounded-3xl bg-blackmail text-ghost-white py-3 pl-4">
            <div className="">
              <h2 className="text-2xl font-bold tablet:text-2xl air:text-2xl ">
                Privacy Pool
              </h2>
            </div>
          </div>
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

