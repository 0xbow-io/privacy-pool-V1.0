import type { CircomkitConfig, CircuitConfig, WitnessTester } from "circomkit"
import { Circomkit } from "circomkit"

import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"

export class circomKit {
  circomkit: Circomkit
  constructor(
    public circuitName: string,
    public circomConf: CircomkitConfig,
    public circuitConf: CircuitConfig
  ) {
    this.circomkit = new Circomkit(this.circomConf)
  }

  async witnessTester(): Promise<WitnessTester> {
    const witTest = await this.circomkit.WitnessTester(
      this.circuitName,
      this.circuitConf
    )
    return witTest
  }

  instantiate() {
    try {
      console.log("Instantiating circuit...")
      this.circomkit.instantiate(this.circuitName)
    } catch (e) {
      console.log(e)
      throw new Error("Failed to instantiate circuit", { cause: e })
    }
  }

  async compile() {
    try {
      console.log("Compiling circuit...")
      const outPath = await this.circomkit.compile(this.circuitName)
      console.log(`Compiled circuit to ${outPath}`)
    } catch (e) {
      console.log(e)
      throw new Error("Failed to compile circuit", { cause: e })
    }
  }

  async setup() {
    try {
      console.log("Setting up circuit...")
      const { proverKeyPath, verifierKeyPath } = await this.circomkit.setup(
        this.circuitName
      )
      return { proverKeyPath, verifierKeyPath }
    } catch (e) {
      console.log(e)
      throw new Error("Failed to setup circuit", { cause: e })
    }
  }

  async generate_contract() {
    try {
      console.log("generating verifier contract...")
      const path = await this.circomkit.contract(this.circuitName)
      await cleanThreads()
      return path
    } catch (e) {
      console.log(e)
      throw new Error("Failed to setup circuit", { cause: e })
    }
  }

  async build() {
    try {
      this.instantiate()
      await this.compile()
      await this.setup()
      await cleanThreads()
    } catch (e) {
      console.log(e)
      throw new Error("Failed to build circuit", { cause: e })
    }
  }
}
