import type { Metadata } from "next"
import { jetBrainMono } from "./fonts"
import Head from "next/head"

import "./globals.css"
import React from "react"
import { Providers } from "@/app/providers.tsx"

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
      <Providers>
        <body className={`${jetBrainMono.className}`}>{children}</body>
      </Providers>
    </html>
  )
}
