import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Trim.ph — Your link, your code, your cut.",
  description:
    "Trim.ph is a free forever, community-driven affiliate marketing ecosystem connecting app builders, traditional vendors, and affiliates.",
  keywords: ["Trim.ph", "affiliate marketing", "Philippines", "free forever", "affiliate programs"],
  icons: {
    icon: "/trimph-logo.svg",
  },
  openGraph: {
    title: "Trim.ph — Your link, your code, your cut.",
    description: "Free forever affiliate marketing ecosystem.",
    siteName: "Trim.ph",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
            <SonnerToaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
