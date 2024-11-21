import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card.tsx"
import { cn } from "@/lib/utils.ts"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion.tsx"
import React, { useCallback, useState } from "react"
import { CirclePlus, Download, Upload, Wallet } from "lucide-react"
import IconButton from "@/components/IconButton/IconButton.tsx"
import { useSDK } from "@metamask/sdk-react"
import { useDropzone } from "react-dropzone"
import { useBoundStore } from "@/stores"
import { Label } from "@/components/ui/label.tsx"
import { Button } from "@/components/ui/button.tsx"

export const AccountCard = ({ className }: { className: string }) => {
  const {
    privKeys,
    privacyKeys,
    masterKey,
    addKey,
    importKeys,
    exportKeys,
    setMasterKey
  } = useBoundStore(
    ({
      privKeys,
      privacyKeys,
      masterKey,
      currPoolFe,
      addKey,
      importKeys,
      exportKeys,
      setMasterKey
    }) => ({
      privKeys,
      privacyKeys,
      masterKey,
      currPoolFe,
      addKey,
      importKeys,
      exportKeys,
      setMasterKey
    })
  )

  const [account, setAccount] = useState<string>()
  const { sdk, connected } = useSDK()

  const connect = async () => {
    try {
      const accounts: string[] = (await sdk?.connect()) as string[]
      setAccount(accounts?.[0])
    } catch (err) {
      console.warn("failed to connect..", err)
    }
  }

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

  const { getInputProps, getRootProps } = useDropzone({ onDrop })

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Master Key:</CardTitle>
        <CardDescription>Always keep your Master Key safe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {connected && (
          <div>
            <>{account && `Connected account: ${account}`}</>
          </div>
        )}
        {masterKey && (
          <>
            <Label
              htmlFor=""
              className={cn("block mb-2 text-sm font-semibold text-blackmail ")}
            >
              Selected key:
            </Label>
            <div className="text-xs text-blackmail pl-2 font-semibold">
              {masterKey.publicAddr}
            </div>
          </>
        )}
        {privacyKeys.length > 0 && (
          <Label
            htmlFor=""
            className={cn("block mb-2 text-sm font-semibold text-blackmail")}
          >
            Available keys:
          </Label>
        )}
        <Accordion type="single" collapsible>
          {privacyKeys?.length ? (
            privacyKeys.map((key, index) => {
              return (
                <AccordionItem
                  key={key.publicAddr}
                  value={key.publicAddr}
                  className=""
                >
                  <AccordionTrigger className="border-b border-gray-50 text-blackmail hover:bg-toxic-orange pl-2 text-xs">
                    {key.publicAddr}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="relative grid grid-cols-1 items-start justify-start gap-y-4 text-wrap pt-4">
                      <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                        <div className="text-xs font-bold text-blackmail">
                          <h2>Private key:</h2>
                        </div>
                        <div>
                          <h2 className="text-xs text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                            {key.pKey}
                          </h2>
                        </div>
                      </div>

                      <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                        <div className="text-xs font-bold text-blackmail">
                          <h2>Public key:</h2>
                        </div>
                        <div>
                          <h2 className="text-xs text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                            {key.publicAddr}
                          </h2>
                        </div>
                      </div>
                      <Button className="w-fit m-auto" onClick={() => setMasterKey(index)}>
                        Select Key
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })
          ) : (
            <div className="text-md flex justify-center">
              Master key is not found. Create or import a key.
            </div>
          )}
        </Accordion>
        <div className="flex justify-center mt-10">
          {!privacyKeys?.length && (
            <IconButton onClick={addKey} icon={<CirclePlus />}>
              Create account
            </IconButton>
          )}
        </div>
      </CardContent>

      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3 2xl:grid-cols-3 justify-around">
          <div className="flex justify-center mt-10">
            <input type="file" {...getInputProps()} />
            <IconButton {...getRootProps()} icon={<Upload />}>
              Import Key
            </IconButton>
          </div>
          <div className="flex justify-center mt-10">
            <IconButton
              onClick={() => exportKeys()}
              icon={<Download />}
              disabled={privKeys && privKeys.length === 0}
            >
              Export Key
            </IconButton>
          </div>
          <div className="flex justify-center mt-10">
            <IconButton
              onClick={() => connect()}
              icon={<Wallet />}
              disabled={true}
            >
              Connect To Metamask
            </IconButton>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
