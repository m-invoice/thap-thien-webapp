import Link from 'next/link'

const items = [
  { title: 'Chủ đề', href: '/admin/topics', desc: 'Tạo và sắp xếp chủ đề học' },
  { title: 'Bài học', href: '/admin/lessons', desc: 'Quản lý nội dung từng tập' },
  { title: 'Câu hỏi', href: '/admin/questions', desc: 'Tạo câu hỏi ôn luyện và thi thử' },
]

export default function AdminPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border p-5 hover:shadow-md transition"
          >
            <div className="text-lg font-semibold">{item.title}</div>
            <div className="text-sm opacity-70 mt-2">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}