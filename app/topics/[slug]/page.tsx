import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: topic, error } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !topic) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-block px-3 py-1 rounded-full border border-black/10 dark:border-white/20 text-sm text-black/60 dark:text-white/60 mb-4">
            Chủ đề học
          </div>

          <h1 className="text-4xl font-bold mb-3">{topic.title}</h1>

          <p className="text-lg text-black/70 dark:text-white/70 max-w-3xl">
            {topic.summary || 'Chưa có mô tả ngắn cho chủ đề này.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="border border-black/10 dark:border-white/20 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-2xl font-semibold">Nội dung bài học</h2>
              <div className="text-sm text-black/50 dark:text-white/50">
                Đọc kỹ trước khi làm bài
              </div>
            </div>

            <div className="whitespace-pre-line leading-8 text-black/80 dark:text-white/80">
              {topic.lesson || 'Chưa có nội dung bài học cho chủ đề này.'}
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-black/10 dark:border-white/20 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-4">Hành động nhanh</h2>

              <div className="space-y-3">
                <a
                  href={`/topics/${topic.slug}/quiz`}
                  className="block w-full px-5 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-semibold text-center"
                >
                  Làm bài kiểm tra
                </a>

                <a
                  href="/dashboard"
                  className="block w-full px-5 py-3 border border-black/10 dark:border-white/20 rounded-xl text-center hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Dashboard
                </a>

                <a
                  href="/history"
                  className="block w-full px-5 py-3 border border-black/10 dark:border-white/20 rounded-xl text-center hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Lịch sử bài thi
                </a>

                <a
                  href="/review"
                  className="block w-full px-5 py-3 border border-black/10 dark:border-white/20 rounded-xl text-center hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Ôn lại câu sai
                </a>

                <Link
                  href="/topics"
                  className="block w-full px-5 py-3 border border-black/10 dark:border-white/20 rounded-xl text-center hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Danh sách chủ đề
                </Link>
              </div>
            </div>

            <div className="border border-black/10 dark:border-white/20 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-4">Gợi ý học</h2>

              <div className="space-y-3 text-sm text-black/70 dark:text-white/70 leading-7">
                <p>
                  1. Đọc kỹ phần nội dung bài học trước.
                </p>
                <p>
                  2. Sau đó làm bài kiểm tra để tự đánh giá.
                </p>
                <p>
                  3. Nếu sai, xem lại phần ôn lại câu sai để nhớ lâu hơn.
                </p>
                <p>
                  4. Làm lại bài kiểm tra sau khi học lại.
                </p>
              </div>
            </div>

            <div className="border border-black/10 dark:border-white/20 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-4">Thông tin chủ đề</h2>

              <div className="space-y-2 text-sm text-black/70 dark:text-white/70">
                <p>
                  <strong>Slug:</strong> {topic.slug}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{' '}
                  {topic.is_published ? 'Đang hiển thị' : 'Ẩn'}
                </p>
                <p>
                  <strong>Thứ tự:</strong> {topic.sort_order ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}