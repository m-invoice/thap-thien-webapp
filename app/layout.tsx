import './globals.css'

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
      <body className="bg-black text-white">
        <header className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <a
              href="/dashboard"
              className="text-xl font-bold hover:opacity-80"
            >
              Thập Thiện Nghiệp Đạo Kinh
            </a>
          </div>
        </header>

        {children}
      </body>
    </html>
  )
}