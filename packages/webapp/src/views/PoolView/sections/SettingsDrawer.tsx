import { cn } from "@/lib/utils.ts"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.tsx"
import { Button } from "@/components/ui/button.tsx"
import { Upload, UserRoundPlus } from "lucide-react"
import React, { useCallback } from "react"
import { useGlobalStore } from "@/stores/global-store.ts"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer.tsx"
import { useDropzone } from "react-dropzone"
import { useMediaQuery } from "@/hooks/use-media-query.tsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.tsx"
import {
  DEFAULT_CHAIN,
  getDefaultPoolIDForChainID,
  PrivacyPools,
  ChainIDToPoolIDs
} from "@privacy-pool-v1/contracts/ts/privacy-pool/constants"

export const SettingsDrawer = () => {
  const isNotMobile = useMediaQuery("(min-width: 768px)")
  const { _settingsDrawer, settingsDrawer } = useGlobalStore((state) => state)

  return isNotMobile ? (
    <Dialog open={_settingsDrawer} onOpenChange={settingsDrawer}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Load or create a new Account and select a Pool to interact with
          </DialogDescription>
        </DialogHeader>
        <SettingsDrawerContent
          onClose={() => settingsDrawer(false)}
          className=""
        />
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={_settingsDrawer} onOpenChange={settingsDrawer}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>
            Load or create a new Account and select a Pool to interact with.
          </DrawerDescription>
        </DrawerHeader>
        <SettingsDrawerContent
          className=""
          onClose={() => settingsDrawer(false)}
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button onClick={() => settingsDrawer(false)} variant="outline">
              Done
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

const SettingsDrawerContent = ({
  onClose,
  className
}: {
  onClose: () => void
  className: string
}) => {
  const { currPoolID, setTargetPool, addKey, importKeys } = useGlobalStore(
    (state) => state
  )

  // on file drop to load local account
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const fileReader = new FileReader()

      if (acceptedFiles[0]) {
        fileReader.readAsText(acceptedFiles[0], "UTF-8")
        fileReader.onload = (d) => {
          if (d.target === null) {
            throw new Error("Failed to read file")
          }
          if (d.target.result) {
            const content = d.target.result
            importKeys(content.toString())
          } else {
            throw new Error("Failed to read file")
          }
        }
      }
    },
    [importKeys]
  )

  const { getRootProps } = useDropzone({ onDrop })

  return (
    <div className={cn("flex flex-col px-6 gap-4", className)}>
      <div className="flex flex-row gap-x-4 items-center justify-items-center">
        <div className="">
          <h2 className="text-blackmail font-semibold text-md">Choose Pool:</h2>
        </div>
        <div className="flex-auto flex-col space-y-1.5">
          <Select
            value={currPoolID}
            onValueChange={(value) => setTargetPool(value)}
          >
            <SelectTrigger
              id="input_commitment_1"
              className="bg-royal-nightfall text-ghost-white border-0  underline decoration-1 underline-offset-4 text-xs laptop:text-base "
            >
              <SelectValue placeholder="Select">{currPoolID}</SelectValue>
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="bg-royal-nightfall text-ghost-white"
            >
              {Array.from(ChainIDToPoolIDs.entries()).map((entry) => {
                return (
                  <SelectGroup key={entry[0]}>
                    <SelectLabel>{entry[0]}</SelectLabel>
                    {entry[1].map((poolId) => {
                      const pool = PrivacyPools.get(poolId)
                      return (
                        <SelectItem key={`${poolId}`} value={`${poolId}`}>
                          {pool?.name}
                        </SelectItem>
                      )
                    })}
                    <SelectSeparator />
                  </SelectGroup>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-auto flex flex-row ">
        <div {...getRootProps()} className="flex-auto flex flex-row ">
          <Button
            onClick={() => {
              onClose()
            }}
            className=" text-blackmail bg-ghost-white hover:text-ghost-white hover:bg-blackmail"
          >
            <Upload className="mx-4 size-6" />
            Load Account
          </Button>
        </div>
        <div className="flex-auto flex flex-row">
          <Button
            onClick={() => {
              addKey()
              onClose()
            }}
            className=" text-blackmail bg-ghost-white hover:text-ghost-white hover:bg-blackmail"
          >
            <UserRoundPlus className="mx-4 size-6" /> New Account
          </Button>
        </div>
      </div>
    </div>
  )
}
