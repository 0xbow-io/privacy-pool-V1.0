import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion.tsx"
import React from "react"
import { ComputeSectionSteps } from "@/views/PoolView/sections/ComputeSection/types.ts"

type StepsHelperAccordionProps = {
  currentStep: ComputeSectionSteps
}

export const StepsHelperAccordion = ({
  currentStep
}: StepsHelperAccordionProps) => {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem key="how_it_works" value="how_it_works" className=" ">
        <AccordionTrigger className="mt-4 border border-blackmail px-2 hover:bg-toxic-orange">
          <h2 className="text-blackmail">How does it work?</h2>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-row relative p-6">
            <div className="flex-auto">
              {stepsHelperAccordionContent[currentStep]}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const stepsHelperAccordionContent = {
  [ComputeSectionSteps.ASPSelection]: (
    <p>
      Privacy Pool utilises a 2 Inputs to 2 Outputs transaction scheme where you
      are computing two{" "}
      <span className="text-toxic-orange"> new commitments </span> from two
      commitments that you own. A commitment is an encrypted value represented
      by an entry (commitment hash) in the Pool&apos;s Merkle Tree.{" "}
      <span className="text-toxic-orange"> Void input commitment </span> has 0
      value and is used as a placeholder for when you don&apos;t want to use an
      existing commitment. <br />
      <br />
      Total sum of the output commitment values need to match the sum of the
      input commitment values + public value.
    </p>
  ),
  [ComputeSectionSteps.Commitments]: (
    <p>
      Privacy Pool utilises a 2 Inputs to 2 Outputs transaction scheme where you
      are computing two{" "}
      <span className="text-toxic-orange"> new commitments </span> from two
      commitments that you own. A commitment is an encrypted value represented
      by an entry (commitment hash) in the Pool&apos;s Merkle Tree.{" "}
      <span className="text-toxic-orange"> Void input commitment </span> has 0
      value and is used as a placeholder for when you don&apos;t want to use an
      existing commitment. <br />
      <br />
      Total sum of the output commitment values need to match the sum of the
      input commitment values + public value.
    </p>
  ),
  [ComputeSectionSteps.SigningKeySelection]: (
    <p>
      Privacy Pool utilises a 2 Inputs to 2 Outputs transaction scheme where you
      are computing two{" "}
      <span className="text-toxic-orange"> new commitments </span> from two
      commitments that you own. A commitment is an encrypted value represented
      by an entry (commitment hash) in the Pool&apos;s Merkle Tree.{" "}
      <span className="text-toxic-orange"> Void input commitment </span> has 0
      value and is used as a placeholder for when you don&apos;t want to use an
      existing commitment. <br />
      <br />
      Total sum of the output commitment values need to match the sum of the
      input commitment values + public value.
    </p>
  ),
  [ComputeSectionSteps.Confirmation]: (
    <p>
      Privacy Pool utilises a 2 Inputs to 2 Outputs transaction scheme where you
      are computing two{" "}
      <span className="text-toxic-orange"> new commitments </span> from two
      commitments that you own. A commitment is an encrypted value represented
      by an entry (commitment hash) in the Pool&apos;s Merkle Tree.{" "}
      <span className="text-toxic-orange"> Void input commitment </span> has 0
      value and is used as a placeholder for when you don&apos;t want to use an
      existing commitment. <br />
      <br />
      Total sum of the output commitment values need to match the sum of the
      input commitment values + public value.
    </p>
  ),
  [ComputeSectionSteps.TransactionProcessing]: (
    <p>
      Privacy Pool utilises a 2 Inputs to 2 Outputs transaction scheme where you
      are computing two{" "}
      <span className="text-toxic-orange"> new commitments </span> from two
      commitments that you own. A commitment is an encrypted value represented
      by an entry (commitment hash) in the Pool&apos;s Merkle Tree.{" "}
      <span className="text-toxic-orange"> Void input commitment </span> has 0
      value and is used as a placeholder for when you don&apos;t want to use an
      existing commitment. <br />
      <br />
      Total sum of the output commitment values need to match the sum of the
      input commitment values + public value.
    </p>
  )
}
