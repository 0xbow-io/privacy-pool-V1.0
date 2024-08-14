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
import { useKeyStore } from "@/providers/global-store-provider.tsx"
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

type SettingsSectionProps = {
  className: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const SettingsDrawer = ({
  className,
  onOpenChange,
  isOpen
}: SettingsSectionProps) => {
  const isNotMobile = useMediaQuery("(min-width: 768px)")

  return isNotMobile ? (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Load or create a new Account and select a Pool to interact with
          </DialogDescription>
        </DialogHeader>
        <SettingsDrawerContent
          onClose={() => onOpenChange(false)}
          className={className}
        />
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>
            Load or create a new Account and select a Pool to interact with.
          </DrawerDescription>
        </DrawerHeader>
        <SettingsDrawerContent
          className={className}
          onClose={() => onOpenChange(false)}
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button onClick={() => onOpenChange(false)} variant="outline">
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
  const {
    getCurrentPool,
    updateTargetPoolChain,
    availChains,
    avilPools,
    generate,
    importFromJSON
  } = useKeyStore((state) => state)

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
            importFromJSON(content.toString())
          } else {
            throw new Error("Failed to read file")
          }
        }
      }
    },
    [importFromJSON]
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
            value={getCurrentPool().id}
            onValueChange={(value) => updateTargetPoolChain(value)}
          >
            <SelectTrigger
              id="input_commitment_1"
              className="bg-royal-nightfall text-ghost-white border-0  underline decoration-1 underline-offset-4 text-xs laptop:text-base "
            >
              <SelectValue placeholder="Select">
                {getCurrentPool().id}
              </SelectValue>
            </SelectTrigger>

            <SelectContent
              position="popper"
              className="bg-royal-nightfall text-ghost-white"
            >
              {availChains.map((chain) => {
                return (
                  <SelectGroup key={chain.name}>
                    <SelectLabel>{chain.name}</SelectLabel>
                    {avilPools.get(chain)?.map((pool) => {
                      return (
                        <SelectItem
                          key={`${pool.chain.name}:${pool.id}`}
                          value={`${pool.chain.name}:${pool.id}`}
                        >
                          {pool.id}
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
            <Upload className="mx-4 size-6" />Load Account
          </Button>
        </div>
        <div className="flex-auto flex flex-row">
          <Button
            onClick={() => {
              generate()
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
