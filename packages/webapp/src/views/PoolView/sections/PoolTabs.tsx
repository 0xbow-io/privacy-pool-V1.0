import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs.tsx"
import { cn } from "@/lib/utils.ts"
import { useGlobalStore } from "@/stores/global-store.ts"
import { AccountCard } from "@/views/PoolView/sections/AccountSection/AccountCard.tsx"
import ComputeSection from "@/views/PoolView/sections/ComputeSection/ComputeSection.tsx"
import { WelcomeSection } from "@/views/PoolView/sections/WelcomeSection.tsx"
import { useState } from "react"

export const PoolTabs = () => {
  const [isWelcomeScreen, setIsWelcomeScreen] = useState(true)

  const { onTabChange, currentTab, privKeys } = useGlobalStore((state) => state)

  return (
    <div className={cn("relative", "flex-auto z-10 w-full")}>
      <Tabs value={currentTab}>
        <div className="flex flex-row gap-x-1 items-start max-phone:flex-col max-phone:gap-y-4">
          <TabsList className="relative flex flex-col items-start w-fit text-blackmail bg-doctor h-fit mt-2 p-4 max-phone:flex-row max-phone:p-2 max-phone:mt-0 max-phone:w-full max-phone:justify-around  ">
            <TabsTrigger
              onClick={() => {
                setIsWelcomeScreen(false)
                onTabChange("account")
              }}
              value="account"
              className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"
            >
              Account
            </TabsTrigger>
            <TabsTrigger
              disabled={!privKeys.length}
              onClick={() => onTabChange("compute")}
              value="compute"
              className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"
            >
              Compute
            </TabsTrigger>
            <TabsTrigger
              disabled={!privKeys.length}
              onClick={() => onTabChange("asp")}
              value="asp"
              className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"
            >
              ASP
            </TabsTrigger>
            <TabsTrigger
              disabled={!privKeys.length}
              onClick={() => onTabChange("records")}
              value="records"
              className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"
            >
              Records
            </TabsTrigger>
            {/*<TabsTrigger*/}
            {/*  onClick={() => onSettingsClick()}*/}
            {/*  value="settings"*/}
            {/*  className="text-xs tablet:text-base laptop:text-md data-[state=active]:bg-blackmail data-[state=active]:text-ghost-white"*/}
            {/*>*/}
            {/*  Settings*/}
            {/*</TabsTrigger>*/}
          </TabsList>
          <TabsContent value="account">
            {isWelcomeScreen ? (
              <WelcomeSection
                onProceedClick={() => {
                  setIsWelcomeScreen(false)
                  onTabChange("account")
                }}
                className=""
              />
            ) : (
              <AccountCard className="bg-doctor" />
            )}
          </TabsContent>
          <TabsContent value="compute">
            <ComputeSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
