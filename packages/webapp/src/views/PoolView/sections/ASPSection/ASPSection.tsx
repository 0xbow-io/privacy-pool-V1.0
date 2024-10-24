import { ASPCard } from "@/views/PoolView/sections/ASPSection/ASPCard.tsx"
import { useState } from "react"

export const ASPSection = () => {
  const [selectedASP, setSelectedASP] = useState<string>("")

  const asps = [
    {
      name: "0xbow",
      description:
        "This is a pretty long multiline description of an ASP." +
        " The ASP indexes & categorizes Privacy Pool Records (i.e. categorizing a book in a library)." +
        "0xbow is a great ASP",
      fee: BigInt(10 ** 10 * 12345),
      icon: "https://cdn.prod.website-files.com/6605d6d31c211547ad8735b3/660711642d54c3603df2411a_0xbow%20Icon%20Black.svg"
    }
  ]
  return (
    <div>
      {asps.map((asp) => (
        <ASPCard
          key={asp.name}
          {...asp}
          isSelected={selectedASP === asp.name}
          handleSelect={(name) => setSelectedASP(name)}
          handleBack={() => setSelectedASP("")}
        />
      ))}
    </div>
  )
}
