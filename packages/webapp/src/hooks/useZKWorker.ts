import { useCallback, useRef } from "react"
import { useWorker } from "../contexts/WorkerContext"

export const useZKWorker = () => {
  const worker = useWorker()
  const busyRef = useRef<Set<number>>(new Set())

  const postMessage = useCallback(
    (message: { cmd: number; [key: string]: any }) => {
      if (!worker) {
        console.error("Post message: Worker is not initialized")
        return
      }

      if (busyRef.current.has(message.cmd)) {
        console.warn(`Worker is busy processing command: ${message.cmd}`)
        return
      }

      busyRef.current.add(message.cmd)
      console.log("postMessage", message.cmd, message)
      worker.postMessage(message)
    },
    [worker]
  )

  const addMessageHandler = useCallback(
    (handler: (event: MessageEvent) => void) => {
      const messageListener = (event: MessageEvent) => {
        const { cmd } = event.data
        busyRef.current.delete(cmd)
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

  return { worker, postMessage, addMessageHandler }
}
