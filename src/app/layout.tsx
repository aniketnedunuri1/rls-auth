import type { Metadata } from "next"
import { Inter} from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ReduxProvider from "@/components/redux-provider"; // ✅ Now Redux runs in a Client Component
import { store } from "@/lib/store"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RLS Testing SaaS",
  description: "Automate RLS and database schema testing",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}

