import type React from "react"
import { TradeProvider } from "@/contexts/TradeContext"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <TradeProvider>{children}</TradeProvider>
      </body>
    </html>
  )
}
