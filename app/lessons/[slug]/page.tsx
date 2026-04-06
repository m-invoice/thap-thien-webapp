import { getLessonBySlug } from '@/lib/queries/lessons'

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const lesson = await getLessonBySlug(slug)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-6">
        <div className="text-sm text-muted-foreground">Tập {lesson.lesson_no}</div>
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <p className="mt-2 text-muted-foreground">{lesson.summary}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border p-5">
            <h2 className="text-xl font-semibold">Tài liệu</h2>
            {lesson.lesson_documents?.length ? (
              lesson.lesson_documents.map((doc: any) => (
                <article key={doc.id} className="mt-4 rounded-xl bg-slate-50 p-4">
                  <h3 className="font-semibold">{doc.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{doc.content_md}</p>
                </article>
              ))
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Chưa có tài liệu.</p>
            )}
          </section>

          <section className="rounded-2xl border p-5">
            <h2 className="text-xl font-semibold">Câu hỏi ôn tập</h2>
            {lesson.questions?.length ? (
              <div className="mt-4 space-y-4">
                {lesson.questions.map((q: any, index: number) => (
                  <div key={q.id} className="rounded-xl bg-slate-50 p-4">
                    <p className="font-medium">
                      Câu {index + 1}. {q.question}
                    </p>
                    <ul className="mt-3 space-y-1 text-sm">
                      <li>A. {q.option_a}</li>
                      <li>B. {q.option_b}</li>
                      <li>C. {q.option_c}</li>
                      <li>D. {q.option_d}</li>
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Chưa có câu hỏi.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border p-5">
            <h2 className="text-lg font-semibold">Video</h2>
            {lesson.lesson_videos?.length ? (
              lesson.lesson_videos.map((video: any) => (
                <div key={video.id} className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="font-medium">{video.title}</p>
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm underline"
                  >
                    Mở video
                  </a>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Chưa có video.</p>
            )}
          </section>

          <section className="rounded-2xl border p-5">
            <h2 className="text-lg font-semibold">Chủ đề liên quan</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {lesson.lesson_topics?.map((item: any) => (
                <span
                  key={item.topics.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                >
                  {item.topics.title}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}