export function loadWorkerDynamically(): Worker | null {
  if (typeof window !== "undefined") {
    return new Worker(new URL("./zk.worker.ts", import.meta.url), {
      type: "module"
    })
  }
  console.log("Not in a browser environment")
  return null
}
