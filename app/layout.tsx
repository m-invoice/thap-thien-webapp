import './globals.css'
import ThemeProvider from '@/app/components/ThemeProvider'

export const metadata = {
  title: 'Thập Thiện Nghiệp đạo Kinh - WebApp',
  description: 'WebApp học Thập Thiện Nghiệp Đạo Kinh',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="bg-white text-black dark:bg-black dark:text-white transition-colors min-h-screen">
        <ThemeProvider>
          <div className="fixed top-0 left-0 right-0 z-50 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
              <div className="font-bold text-lg">Thập Thiện Nghiệp Đạo Kinh</div>
              <div className="flex items-center gap-2 text-sm">
                <a href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10">Dashboard</a>
                <a href="/topics" className="rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10">Học tiếp</a>
                <a href="/history" className="rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10">Lịch sử</a>
                <a href="/review" className="rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10">Ôn lại câu sai</a>
              </div>
            </div>
          </div>

          <div className="pt-16">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}