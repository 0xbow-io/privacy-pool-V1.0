import { cn } from "@/lib/utils.ts"
import Button from "@/components/Button/Button.tsx"

type WelcomeSectionProps = {
  className: string
  onProceedClick: () => void
}
export const WelcomeSection = ({
  className,
  onProceedClick
}: WelcomeSectionProps) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="z-20 relative grid  grid-cols-2 items-center justify-center bg-blackmail px-8 py-8 shadow-md shadow-blackmail">
        <div className="relative col-span-2 row-span-3 row-start-3 flex flex-col items-start justify-start border-l-2 border-ghost-white pl-4 text-ghost-white  ">
          <div className="relative flex ">
            <h2 className=" text-balance text-start font-bold leading-relaxed text-ghost-white text-xl tablet:text-3xl laptop:text-4xl">
              A Privacy-Preserving Protocol for the EVM.
            </h2>
          </div>
          <div className="flex py-6">
            <p className=" z-10 text-pretty text-justify leading-relaxed text-ghost-white text-xs tablet:text-base laptop:text-lg ">
              Privacy pools is a zero-knoweldge protocol.
              <br />
              <br />
              You can start on Accounts tab where you can{" "}
              <span className="text-toxic-orange">
                {" "}
                Create or import your Privacy Keys
              </span>
            </p>
          </div>
          <div className="flex justify-center mt-6">
            <Button variant="primary" onClick={() => onProceedClick()}>
              Go to accounts
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
