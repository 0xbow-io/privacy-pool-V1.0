import { ethers, WebSocketProvider } from "ethers"

const provider = new WebSocketProvider(
  process.env.NEXT_PUBLIC_INFURA_PROJECT_URL || "",
  "sepolia",
  { staticNetwork: true }
)

if (provider.websocket) {
  provider.websocket.onerror = (error: Event) => {
    console.error("WebSocket connection error:", error)
  }
}

provider
  ._detectNetwork()
  .then((network) => {
    console.log(`Connected to network: ${network.name}`)
  })
  .catch((error) => {
    console.error("Failed to detect network:", error)
  })

export default provider
