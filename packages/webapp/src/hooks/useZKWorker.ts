import { useCallback, useState } from "react"
import { useWorker } from "../contexts/WorkerContext"

export const useZKWorker = () => {
  const worker = useWorker()
  const [busy, setBusy] = useState<Set<number>>(new Set())

  const postMessage = useCallback(
    (message: { cmd: number; [key: string]: any }) => {
      if (worker) {
        setBusy((prev) => {
          const newSet = new Set(prev)
          if (newSet.has(message.cmd)) {
            console.warn(`Worker is busy processing command: ${message.cmd}`)
            return prev
          }
          newSet.add(message.cmd)
          console.log('postMessage', message.cmd, message)
          worker.postMessage(message)
          return newSet
        })
      } else {
        console.error("Post message: Worker is not initialized")
      }
    },
    [worker]
  )

  const addMessageHandler = useCallback(
    (handler: (event: MessageEvent) => void) => {
      const messageListener = (event: MessageEvent) => {
        const { cmd } = event.data
        setBusy((prev) => {
          const newSet = new Set(prev)
          newSet.delete(cmd)
          return newSet
        })
        handler(event)
      }

      if (worker) {
        worker.addEventListener("message", messageListener)
      } else {
        console.error("Message handler: Worker is not initialized")
      }

      return () => {
        if (worker) {
          worker.removeEventListener("message", messageListener)
        }
      }
    },
    [worker]
  )

  return { worker, postMessage, addMessageHandler, busy }
}
