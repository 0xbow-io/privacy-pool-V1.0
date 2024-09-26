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

export const AccountCard = ({ className }: { className: string }) => {
  const { privKeys, privacyKeys, addKey, importKeys, exportKeys } =
    useBoundStore(
      ({
        privKeys,
        addKey,
        importKeys,
        exportKeys,
        privacyKeys,
        currPoolFe
      }) => ({
        privKeys,
        addKey,
        importKeys,
        exportKeys,
        privacyKeys,
        currPoolFe
      })
    )

  console.log("keys", privacyKeys)
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

  const { getRootProps } = useDropzone({ onDrop })

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
          {privacyKeys?.length ? (
            privacyKeys.map((key) => {
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })
          ) : (
            <div className="text-md flex justify-center">
              You do not have any imported keys
            </div>
          )}
        </Accordion>
        <div className="flex justify-center mt-10">
          <IconButton onClick={addKey} icon={<CirclePlus />} disabled={false}>
            {privKeys && !!privKeys.length ? "Add new key" : "Create account"}
          </IconButton>
        </div>
      </CardContent>

      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3 2xl:grid-cols-3 justify-around">
          <div className="flex justify-center mt-10">
            <IconButton {...getRootProps()} icon={<Upload />} disabled={false}>
              Import Keys
            </IconButton>
          </div>
          <div className="flex justify-center mt-10">
            <IconButton
              onClick={() => exportKeys()}
              icon={<Download />}
              disabled={privKeys && privKeys.length === 0}
            >
              Export Keys
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
