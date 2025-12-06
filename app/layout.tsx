import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LLMProvider } from "@/lib/contexts/llm-context"
import { ProjectProvider } from "@/lib/contexts/project-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GenAI Chat UI",
  description: "A sleek custom UI for chatting with LLMs",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ProjectProvider>
          <LLMProvider>{children}</LLMProvider>
        </ProjectProvider>
      </body>
    </html>
  )
}

