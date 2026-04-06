import { NextResponse } from 'next/server'
import { getLessonBySlug } from '@/lib/queries/lessons'

type Props = {
  params: Promise<{ slug: string }>
}

export async function GET(_: Request, { params }: Props) {
  try {
    const { slug } = await params
    const lesson = await getLessonBySlug(slug)

    return NextResponse.json({ ok: true, data: lesson })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}