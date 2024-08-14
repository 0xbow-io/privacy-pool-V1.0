import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from "@/components/ui/button.tsx"
import React, { useCallback, useState } from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import { CirclePlus, Download, Upload, Wallet } from "lucide-react"
import IconButton from "@/components/IconButton/IconButton.tsx"
import { useSDK } from "@metamask/sdk-react"
import { useDropzone } from "react-dropzone"

export const AccountCard = ({ className }: { className: string }) => {
  const { keys, generate, importFromJSON, exportToJSON } = useKeyStore(
    (state) => state
  )
  const [account, setAccount] = useState<string>()

  const { sdk, connected, chainId } = useSDK()

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

  console.log("connected:", connected)

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Privacy Keys:</CardTitle>
        <CardDescription>Always keep your privacy keys safe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {connected && (
          <div>
            <>{account && `Connected account: ${account}`}</>
          </div>
        )}
        <Accordion type="single" collapsible>
          {keys && keys.length ? (
            keys.map((key) => {
              const jsonKey = key.asJSON
              return (
                <AccordionItem
                  key={jsonKey.pubAddr}
                  value={jsonKey.pubAddr}
                  className=""
                >
                  <AccordionTrigger className="border-b border-gray-50 text-blackmail hover:bg-toxic-orange pl-2 text-xs">
                    {jsonKey.pubAddr}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="relative grid grid-cols-1 items-start justify-start gap-y-4 text-wrap pt-4">
                      <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                        <div className="text-xs font-bold text-blackmail">
                          <h2>Private key:</h2>
                        </div>
                        <div>
                          <h2 className="text-xs text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                            {jsonKey.privateKey}
                          </h2>
                        </div>
                      </div>

                      <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                        <div className="text-xs font-bold text-blackmail">
                          <h2>Public key:</h2>
                        </div>
                        <div>
                          <h2 className="text-xs text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                            {jsonKey.pubAddr}
                          </h2>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })
          ) : (
            <div className="text-md flex justify-center">
              You don't have any imported keys
            </div>
          )}
        </Accordion>
        <div className="flex justify-center mt-10">
          <IconButton onClick={generate} icon={<CirclePlus />}>
            {keys && !!keys.length ? "Add new key" : "Create account"}
          </IconButton>
        </div>
      </CardContent>

      <CardContent className="space-y-2">
        <CardTitle>Keys Import:</CardTitle>
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 2xl:grid-cols-3 justify-around">
          <Button
            {...getRootProps()}
            className="w-full rounded-none border-0 bg-doctor text-lg font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
          >
            <Upload className="mx-4 size-6" />
            Import from JSON
          </Button>
          <Button
            onClick={() => connect()}
            className="w-full rounded-none border-0 bg-doctor text-lg font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
          >
            <Wallet className="mx-4 size-6" /> Connect Metamask
          </Button>
        </div>
      </CardContent>
      {keys && !!keys.length && (
        <CardContent className="space-y-2">
          <CardTitle>Keys Export:</CardTitle>
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 2xl:grid-cols-3 justify-around">
            <Button
              onClick={() => exportToJSON(true)}
              className="w-full rounded-none border-0 bg-doctor text-lg font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
            >
              <Download className="mx-4 size-6" />
              Export to JSON
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
