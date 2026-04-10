import type {Metadata} from 'next'
import {JetBrains_Mono, Lato, Anton} from 'next/font/google'
import './globals.css'

const anton = Anton({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
})

const lato = Lato({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '400'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['300', '400'],
})

export const metadata: Metadata = {
  title: 'Borg-Skum',
  description: 'Tidningen Borg-Skum',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="sv" className={`${jetbrainsMono.variable} ${lato.variable} ${anton.variable} antialiased`}>
      <body style={{margin: 0, padding: 0, background: '#fff', color: '#171717'}}>
        {children}
      </body>
    </html>
  )
}
