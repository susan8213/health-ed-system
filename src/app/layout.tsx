import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '智慧醫療管理系統',
  description: '智慧醫療管理系統 - 患者資料與病歷記錄管理平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}