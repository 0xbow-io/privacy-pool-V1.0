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
import React from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"

export const AccountCard = ({ className }: { className: string }) => {
  const { keys, generate, exportToJSON } = useKeyStore((state) => state)

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Privacy Keys:</CardTitle>
        <CardDescription>Always keep your privacy keys safe</CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        <Accordion type="single" collapsible>
          {keys.map((key) => {
            const jsonKey = key.asJSON
            return (
              <AccordionItem
                key={jsonKey.pubAddr}
                value={jsonKey.pubAddr}
                className=""
              >
                <AccordionTrigger className=" border-b border-blackmail  text-blackmail hover:bg-toxic-orange text-xs">
                  {jsonKey.pubAddr}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="relative grid grid-cols-1  items-start justify-start gap-y-4 text-wrap pt-10">
                    <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                      <div className="text-xs font-bold text-blackmail">
                        <h2> privateKey: </h2>
                      </div>
                      <div>
                        <h2 className="text-xs text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                          {jsonKey.privateKey}
                        </h2>
                      </div>
                    </div>

                    <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                      <div className="text-xsfont-bold text-blackmail">
                        <h2> keypair: </h2>
                      </div>
                      <div>
                        <h2 className="text-xs  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                          tba
                          {/*{jsonKey.keypair.privKey}*/}
                        </h2>
                      </div>
                      <div>
                        <h2 className="text-xs text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                          tba
                          {/*{jsonKey.keypair.pubKey}*/}
                        </h2>
                      </div>
                    </div>

                    <div className="group flex flex-col gap-y-4 border-b border-blackmail">
                      <div className="text-xsfont-bold text-blackmail">
                        <h2> encryption keys: </h2>
                      </div>
                      <div>
                        <h2 className="text-xs  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                          {jsonKey._secret.x}
                        </h2>
                      </div>
                      <div>
                        <h2 className="text-xs  text-doctor transition-all duration-300 ease-in group-hover:text-blackmail">
                          {jsonKey._secret.y}
                        </h2>
                        l
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>

      <CardFooter>
        <div
          className={cn(
            "relative flex w-full flex-row items-center justify-end gap-x-4 text-blackmail duration-300 ease-in",
            className
          )}
        >
          <div className="flex flex-row  border-b-2 border-b-blackmail">
            <Button
              onClick={generate}
              className="w-full rounded-none border-0 bg-doctor text-lg  font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
            >
              Add Key
            </Button>
          </div>
          <div className="flex flex-row  border-b-2 border-b-blackmail">
            <Button
              onClick={() => exportToJSON(true)}
              className="w-full  rounded-none border-0 bg-doctor text-lg font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
            >
              Export Keys
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
