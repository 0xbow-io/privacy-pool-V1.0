import type { Metadata } from "next"
import { jetBrainMono } from "./fonts"
import Head from "next/head"
import { KeyStoreProvider } from "@/providers/key-store-provider"

import "./globals.css"

export const metadata: Metadata = {
  title: "privacy pool v1",
  description: "privacy pool v1"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body className={`${jetBrainMono.className}`}>
        <KeyStoreProvider>{children}</KeyStoreProvider>
      </body>
    </html>
  )
}
