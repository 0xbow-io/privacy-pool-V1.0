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
import type { Hex } from "viem"
import React, { useEffect, useState } from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import { InputCommitments } from "@/views/PoolView/sections/TransactionsSection/InputCommitments.tsx"
import { OutputCommitments } from "@/views/PoolView/sections/TransactionsSection/OutputCommitments.tsx"
import { loadWorkerDynamically } from "@/workers/WorkerLazyLoader.ts"
import { Loader } from "@/components/Loader/Loader.tsx"

enum WorkerStatus {
  IDLE,
  BUSY,
  SUCCESS,
  ERROR
}

export const TransactionCard = ({ className }: { className: string }) => {
  const {
    extraAmountIsValid,
    extraAmountReason,
    publicValue,
    updatePublicValue,
    generate,
    keys

  } = useKeyStore((state) => state)

  const [worker, setWorker] = useState<Worker | null>(null)
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>(WorkerStatus.IDLE)

  useEffect(() => {
    loadWorkerDynamically().then(setWorker)

    // Cleanup function to terminate the worker when the component unmounts
    return () => {
      if (worker) {
        worker.terminate()
      }
    }
  }, [])

  useEffect(() => {
    if (workerStatus === WorkerStatus.SUCCESS || workerStatus === WorkerStatus.ERROR) {
      setTimeout(() => setWorkerStatus(WorkerStatus.IDLE), 5000)
    }
  }, [workerStatus])

  useEffect(() => {
    if (worker) {
      worker.onmessage = (event) => {
        const { action, payload } = event.data
        if (action === "makeCommitRes") {
          console.log("Message from worker:", payload)
          setWorkerStatus(WorkerStatus.SUCCESS)
        } else if (action === "makeCommitErr") {
          console.error("Worker error:", payload)
          setWorkerStatus(WorkerStatus.ERROR)
        }
      }

      worker.onerror = (error) => {
        console.error("Worker error:", error)
        setWorkerStatus(WorkerStatus.ERROR)
      }
    }
  }, [worker])

  const testWorker = (key: Hex) => {
    console.log("testing worker", key)
    if (!worker) {
      console.log("no worker found")
    }
    worker?.postMessage({ action: "makeCommit", privateKey: key })
    setWorkerStatus(WorkerStatus.BUSY)
  }

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="">
        <CardTitle className="pt-6 border-t-2  border-blackmail text-xl font-bold">
          Compute Commitments & Releases
        </CardTitle>
        <CardDescription className="font-bold text-blackmail">
          <div className="flex-auto">
            <Accordion type="single" collapsible>
              <AccordionItem
                key="how_it_works"
                value="how_it_works"
                className=" "
              >
                <AccordionTrigger className="mt-4 border border-blackmail px-2  hover:bg-toxic-orange">
                  <h2 className="text-blackmail "> How does it work? </h2>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-row relative p-6">
                    <div className="flex-auto">
                      <p>
                        Privacy Pool utilises a 2 Inputs to 2 Outputs
                        transaction scheme where you are computing two{" "}
                        <span className="text-toxic-orange">
                          {" "}
                          new commitments{" "}
                        </span>{" "}
                        from two commitments that you own. A commitment is an
                        encrypted value represented by an entry (commitment
                        hash) in the Pool&apos;s Merkle Tree.{" "}
                        <span className="text-toxic-orange">
                          {" "}
                          Void input commitment{" "}
                        </span>{" "}
                        has 0 value and is used as a placeholder for when you
                        don&apos;t want to use an existing commitment. <br />
                        <br />
                        Total sum of the output commitment values need to match
                        the sum of the input commitment values + public value.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex flex-col gap-y-4 tablet:flex-row tablet:items-center tablet:gap-4">
          <div className="flex-auto">
            <InputCommitments className="" />
          </div>
          <div className="flex-auto flex flex-col gap-y-2 tablet:pt-6">
            <label
              htmlFor="extra-amount"
              className={cn(
                "block mb-2 text-sm font-semibold text-blackmail ",
                extraAmountIsValid ? "text-blackmail" : "text-rust-effect"
              )}
            >
              Extra Amount:
            </label>
            <input
              id="extra-amount"
              type="number"
              placeholder={publicValue.toString()}
              onChange={(e) => updatePublicValue(Number(e.target.value))}
              className={cn(
                "px-4 py-3 text-sm font-semibold text-blackmail ",
                extraAmountIsValid ? "text-blackmail" : "text-rust-effect"
              )}
            />
            <h2 className="mt-2 text-sm font-semibold text-rust-effect">
              {extraAmountReason}
            </h2>
          </div>
          <div className="flex-auto">
            {<OutputCommitments className="border-2" />}
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-4">
        <div
          className={cn(
            "relative flex flex-row gap-4 text-blackmail duration-300 ease-in",
            className
          )}
        >
          <div className="flex flex-row m-2">
            <Button
              onClick={generate}
              className="w-full rounded-none border-2 mr-2 border-blackmail bg-doctor text-lg font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
            >
              Compute
            </Button>
            <Button
              className="w-full rounded-none border-2 border-blackmail bg-doctor text-lg font-bold text-blackmail hover:bg-blackmail hover:text-doctor"
              onClick={() => {
                const key = keys[0].asJSON.privateKey as Hex
                console.log("mykey", keys[0].asJSON, key)

                testWorker(key)
              }}
            >
              Process
            </Button>
          </div>
        </div>
      </CardFooter>
      <Loader loading={workerStatus == WorkerStatus.BUSY} />
    </Card>
  )
}
