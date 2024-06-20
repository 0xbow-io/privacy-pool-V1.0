
import type {  CircomkitConfig, CircuitConfig } from "circomkit"
import { Circomkit, WitnessTester } from "circomkit"
import path from "path"
import fs from "fs"

import { cleanThreads } from "@privacy-pool-v1/global"
  
function moveFileIfExists(
    sourceFilePath: string,
    destinationDir: string
  ): void {
    const destinationFilePath = path.join(
      destinationDir,
      path.basename(sourceFilePath)
    )
  
    fs.access(sourceFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`File ${sourceFilePath} does not exist.`)
        return
      }
  
      fs.rename(sourceFilePath, destinationFilePath, (renameErr) => {
        if (renameErr) {
          console.error(`Error moving file: ${renameErr}`)
        } else {
          console.log(
            `File moved from ${sourceFilePath} to ${destinationFilePath}`
          )
        }
      })
    })
  }

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
    const witTest =  await this.circomkit.WitnessTester(this.circuitName, this.circuitConf)
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

  async generate_contract(finalPath: string = "") {
    try {
      console.log("generating verifier contract...")
      const path = await this.circomkit.contract(this.circuitName)
      moveFileIfExists(path, finalPath)
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
