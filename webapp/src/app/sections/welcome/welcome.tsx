
export default function WelcomeSection() {
    return (
        <div className="flex flex-col ">
            <div className="z-20 relative grid  grid-cols-2 items-center justify-center bg-blackmail px-8 py-8 shadow-md shadow-blackmail">
                <div className="relative col-span-2 row-span-3 row-start-3 flex flex-col items-start justify-start border-l-2 border-ghost-white px-10 text-ghost-white  ">
                    <div className="relative flex ">
                        <h2 className=" text-balance text-start text-4xl  font-bold leading-relaxed text-ghost-white">
                            Regulatory Compliant Privacy Protocol for the EVM
                        </h2>
                    </div>
                    <div className="flex py-6">
                        <p className=" z-10 text-pretty text-justify text-lg  leading-relaxed text-ghost-white ">
                            Privacy pools extends previous zero-knowledge proofs (ZKPs) privacy tools by
                            allowing users to publicly publish an additional ZKP to prove that the funds they
                            commit to the protocol are not associated with illicit funds from other users,
                            helping to isolate illicit funds.
                            <br />
                            <br />
                            Click on the <span className='text-toxic-orange'> Load Account </span> button above to load an existing account or create a new one via <span className='text-toxic-orange'> New Account </span> 
                        </p>
                    </div>
                </div>
            </div>       
        </div>
    );
}