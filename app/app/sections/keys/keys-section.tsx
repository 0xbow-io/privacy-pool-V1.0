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
            <AccordionTrigger className=" border-b border-dominant-blue px-2 text-dominant-blue hover:bg-vanilla-cream ">
              Address: {key.Address}
            </AccordionTrigger>
            <AccordionContent>
              <div className="relative grid grid-cols-1 grid-rows-5 items-start justify-start gap-y-4 text-wrap  px-4 pt-10">
                <div className="group flex flex-col gap-y-4 border-b border-dominant-blue">
                  <div className="text-sm font-bold text-dominant-blue">
                    <h2> Private Key: </h2>
                  </div>
                  <div>
                    <h2 className="text-sm  text-page-background transition-all duration-300 ease-in group-hover:text-dominant-blue">
                      {key.PrivateKey}
                    </h2>
                  </div>
                </div>
                <div className="group flex flex-col gap-y-4 border-b border-dominant-blue ">
                  <div className="text-sm font-bold text-dominant-blue">
                    <h2> Pk: </h2>
                  </div>
                  <div className="relative">
                    <h2 className=" text-wrap text-sm text-page-background transition-all duration-300 ease-in group-hover:text-dominant-blue">
                      {key.Pk}{' '}
                    </h2>
                  </div>
                </div>

                <div className="group flex flex-col gap-y-4 border-b border-dominant-blue ">
                  <div className="text-sm font-bold text-dominant-blue">
                    <h2> pK: </h2>
                  </div>
                  <div className="relative">
                    <h2 className=" text-wrap text-sm text-page-background transition-all duration-300 ease-in group-hover:text-dominant-blue">
                      {key.pK}{' '}
                    </h2>
                  </div>
                </div>

                <div className="group flex flex-col gap-y-4 border-b border-dominant-blue ">
                  <div className="text-sm font-bold text-dominant-blue">
                    <h2> Encryption Keys: </h2>
                  </div>
                  <div>
                    <h2 className="text-sm  text-page-background transition-all duration-300 ease-in group-hover:text-dominant-blue">
                      {key.eK[0]}
                    </h2>
                    <div>
                      <h2 className="text-sm  text-page-background transition-all duration-300 ease-in group-hover:text-dominant-blue">
                        {key.eK[1]}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="group flex flex-col gap-y-4 border-b border-dominant-blue">
                  <div className="text-sm font-bold text-dominant-blue">
                    <h2> Number of CTX Records: </h2>
                  </div>
                  <div>
                    <h2 className=" text-sm text-dominant-blue">{key.noOfCtx.toString()} </h2>
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
