import { cn } from "@/lib/utils.ts"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs.tsx"
import { AccountCard } from "@/views/PoolView/sections/AccountCard.tsx"
import React from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import { WelcomeSection } from "@/views/PoolView/sections/WelcomeSection.tsx"
import { TransactionCard } from "@/views/PoolView/sections/TransactionsSection/TransactionCard.tsx"

export enum TabsValue {
  Account = "account",
  Compute = "compute",
  Asp = "asp",
  Records = "records",
  Settings = "settings"
}

type PoolTabsProps = {
  currentTab: TabsValue
  onTabChange: (tab: TabsValue) => void
  // className?: string
  onSettingsClick: () => void
}

export const PoolTabs = ({
  currentTab,
  onTabChange,
  onSettingsClick
}: PoolTabsProps) => {
  const { notEmpty } = useKeyStore((state) => state)
  const hasWallet = notEmpty()

  return (
    <div className={cn("relative", "flex-auto z-10")}>
      <Tabs value={currentTab}>
        <div className="flex flex-row gap-x-1 items-start max-phone:flex-col max-phone:gap-y-4">
          <TabsList className="relative flex flex-col items-start w-fit text-blackmail bg-doctor h-fit mt-2 p-4 max-phone:flex-row max-phone:p-2 max-phone:mt-0 max-phone:w-full max-phone:justify-around  ">
            <TabsTrigger
              onClick={() => onTabChange(TabsValue.Account)}
              value="account"
              className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"
            >
              Account
            </TabsTrigger>
            <TabsTrigger
              disabled={!hasWallet}
              onClick={() => onTabChange(TabsValue.Compute)}
              value="compute"
              className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"
            >
              Compute
            </TabsTrigger>
            <TabsTrigger
              disabled={!hasWallet}
              onClick={() => onTabChange(TabsValue.Asp)}
              value="asp"
              className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"
            >
              ASP
            </TabsTrigger>
            <TabsTrigger
              disabled={!hasWallet}
              onClick={() => onTabChange(TabsValue.Records)}
              value="records"
              className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"
            >
              Records
            </TabsTrigger>
            <TabsTrigger
              onClick={() => onSettingsClick()}
              value="settings"
              className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"
            >
              Settings
            </TabsTrigger>
          </TabsList>
          <div>
            <TabsContent value="account">
              {notEmpty() ? (
                <AccountCard className="bg-doctor" />
              ) : (
                <WelcomeSection className="" />
              )}
            </TabsContent>
            <TabsContent value="compute">
              <TransactionCard className="bg-doctor" />
            </TabsContent>
          </div>
        </div>
      </Tabs>
      {/*{Inputs_Dialog("absolute")}*/}
      {/*{Outputs_Dialog("absolute")}*/}
    </div>
  )
}