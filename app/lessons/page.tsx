import { getPublishedLessons } from '@/lib/queries/lessons'
import Link from 'next/link'

export default async function LessonsPage() {
  const lessons = await getPublishedLessons()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Học theo tập</h1>
        <p className="text-sm text-muted-foreground">
          Danh sách bài học từ tập 1 đến tập 80.
        </p>
      </div>

      <div className="grid gap-4">
        {lessons.map((lesson: any) => (
          <div key={lesson.id} className="rounded-2xl border p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Tập {lesson.lesson_no}
                </div>
                <h2 className="text-xl font-semibold">{lesson.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lesson.short_summary}
                </p>
              </div>

              <Link
                href={`/lessons/${lesson.slug}`}
                className="rounded-xl bg-slate-900 px-4 py-2 text-white"
              >
                Học bài
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}