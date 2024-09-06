import dotenv from "dotenv"

dotenv.config()

const config = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.worker\.js$/,
        use: {
          loader: "worker-loader",
          options: { filename: "static/workers/[name].[hash].worker.js" }
        }
      })
    }

    return config
  },
  env: {
    NEXT_PUBLIC_INFURA_PROJECT_URL: process.env.INFURA_PROJECT_URL,
    NEXT_PUBLIC_INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
    NEXT_PUBLIC_INFURA_PROJECT_SECRET: process.env.INFURA_PROJECT_SECRET,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS
  }
}
export default config
