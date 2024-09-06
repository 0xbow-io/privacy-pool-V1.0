import { bits, getRandomHex, HexToBabyJubJubScalar } from "../fn.privacykeys"

describe("Testing privacykeys Function", () => {
  test("getRandomHex should generate random hex values", () => {
    for (let i = 0; i < 100; i++) {
      const _res = getRandomHex()
      expect(_res).not.toStrictEqual(getRandomHex())
    }
  })
  test("HexToBabyJubJubScalar should generate valid saclar values", () => {
    for (let i = 0; i < 100; i++) {
      const _res = HexToBabyJubJubScalar()

      // less than the prime field size
      expect(_res).toBeLessThan(
        21888242871839275222246405745257275088548364400416034343698204186575808495617n
      )

      // less than the suborder prime
      expect(_res).toBeLessThan(
        2736030358979909402780800718157159386076813972158567259200215660948447373041n
      )

      const _res_bits = bits(_res)
      console.log(
        `scalar: ${_res} scalar-bits: ${_res_bits.join("")} len: ${_res_bits.length}`
      )
      expect(_res_bits.length).toBeLessThanOrEqual(251)
    }
  })
})
