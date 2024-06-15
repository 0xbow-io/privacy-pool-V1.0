
import { cn } from '@/lib/utils';

interface props {
    className: string;
}
export default function WelcomeSection({className}: props) {
    return (
        <div className={cn("flex flex-col", className)}>
            <div className="z-20 relative grid  grid-cols-2 items-center justify-center bg-blackmail px-8 py-8 shadow-md shadow-blackmail">
                <div className="relative col-span-2 row-span-3 row-start-3 flex flex-col items-start justify-start border-l-2 border-ghost-white pl-4 text-ghost-white  ">
                    <div className="relative flex ">
                        <h2 className=" text-balance text-start font-bold leading-relaxed text-ghost-white text-xl tablet:text-3xl laptop:text-4xl">
                            Regulatory Compliant Privacy Protocol for the EVM
                        </h2>
                    </div>
                    <div className="flex py-6">
                        <p className=" z-10 text-pretty text-justify leading-relaxed text-ghost-white text-xs tablet:text-base laptop:text-lg ">
                            Privacy pools extends previous zero-knowledge proofs (ZKPs) privacy tools by allowing users to publicly publish an additional ZKP to prove that the funds they commit to the protocol are not associated with illicit funds from other users, helping to isolate illicit funds.
                            <br/>
                            <br/>
                            Access the settings tab & click <span className='text-toxic-orange'> Load Account </span> button to load an existing account or create a new one via <span className='text-toxic-orange'> New Account </span> 
                        </p>
                    </div>
                </div>
            </div>       
        </div>
    );
}