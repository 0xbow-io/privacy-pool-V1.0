import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { PrivacyKeyUI } from '@core/account';

interface State {
  keyList: PrivacyKeyUI[];
}

export function KeysSection({ keyList }: State) {
  return (
    <Accordion type="single" collapsible>
      {keyList.map((key) => {
        return (
          <AccordionItem key={key.Address} value={key.Address} className=" ">
            <AccordionTrigger className=" border-dominant-blue text-dominant-blue hover:bg-vanilla-cream border-b px-2 ">
              Address: {key.Address}
            </AccordionTrigger>
            <AccordionContent>
              <div className="relative grid grid-cols-1 grid-rows-5 items-start justify-start gap-y-4 text-wrap  px-4 pt-10">
                <div className="border-dominant-blue group flex flex-col gap-y-4 border-b">
                  <div className="text-dominant-blue text-sm font-bold">
                    <h2> Private Key: </h2>
                  </div>
                  <div>
                    <h2 className="group-hover:text-dominant-blue  text-sm text-page-background transition-all duration-300 ease-in">
                      {key.PrivateKey}
                    </h2>
                  </div>
                </div>
                <div className="border-dominant-blue group flex flex-col gap-y-4 border-b ">
                  <div className="text-dominant-blue text-sm font-bold">
                    <h2> Pk: </h2>
                  </div>
                  <div className="relative">
                    <h2 className=" group-hover:text-dominant-blue text-wrap text-sm text-page-background transition-all duration-300 ease-in">
                      {key.Pk}{' '}
                    </h2>
                  </div>
                </div>

                <div className="border-dominant-blue group flex flex-col gap-y-4 border-b ">
                  <div className="text-dominant-blue text-sm font-bold">
                    <h2> pK: </h2>
                  </div>
                  <div className="relative">
                    <h2 className=" group-hover:text-dominant-blue text-wrap text-sm text-page-background transition-all duration-300 ease-in">
                      {key.pK}{' '}
                    </h2>
                  </div>
                </div>

                <div className="border-dominant-blue group flex flex-col gap-y-4 border-b ">
                  <div className="text-dominant-blue text-sm font-bold">
                    <h2> Encryption Keys: </h2>
                  </div>
                  <div>
                    <h2 className="group-hover:text-dominant-blue  text-sm text-page-background transition-all duration-300 ease-in">
                      {key.eK[0]}
                    </h2>
                    <div>
                      <h2 className="group-hover:text-dominant-blue  text-sm text-page-background transition-all duration-300 ease-in">
                        {key.eK[1]}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="border-dominant-blue group flex flex-col gap-y-4 border-b">
                  <div className="text-dominant-blue text-sm font-bold">
                    <h2> Number of CTX Records: </h2>
                  </div>
                  <div>
                    <h2 className=" text-dominant-blue text-sm">{key.noOfCtx.toString()} </h2>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
