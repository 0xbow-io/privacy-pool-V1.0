import type { Metadata } from "next"
import { jetBrainMono } from "./fonts"
import "./globals.css"
import { Providers } from "@/app/providers"

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Privacy Pool V1.0"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${jetBrainMono.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}