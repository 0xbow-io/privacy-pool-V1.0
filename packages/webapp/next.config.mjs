export default {
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
  }
}
