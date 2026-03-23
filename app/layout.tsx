import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'RP CRM — Revenue Precision',
  description: 'B2B Sales CRM for Revenue Precision',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  )
}
