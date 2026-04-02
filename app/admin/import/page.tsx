'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'

type ImportRow = {
  topic_slug: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation?: string
  sort_order?: number
  is_published?: boolean | string
}

export default function ImportQuestionsPage() {
  const [rows, setRows] = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const normalizeRow = (row: any): ImportRow => {
    return {
      topic_slug: String(row.topic_slug || '').trim(),
      question: String(row.question || '').trim(),
      option_a: String(row.option_a || '').trim(),
      option_b: String(row.option_b || '').trim(),
      option_c: String(row.option_c || '').trim(),
      option_d: String(row.option_d || '').trim(),
      correct_option: String(row.correct_option || '').trim().toUpperCase(),
      explanation: String(row.explanation || '').trim(),
      sort_order: row.sort_order ? Number(row.sort_order) : 0,
      is_published:
        String(row.is_published || 'true').toLowerCase() === 'true',
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setMessage('')
    setFileName(file.name)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      const normalized = jsonData.map(normalizeRow)

      setRows(normalized)
      setMessage(`Đã đọc ${normalized.length} dòng từ file.`)
    } catch (error) {
      setMessage('Không đọc được file. Kiểm tra lại định dạng Excel/CSV.')
      setRows([])
    }
  }

  const handleImport = async () => {
    if (rows.length === 0) {
      setMessage('Chưa có dữ liệu để import.')
      return
    }

    setLoading(true)
    setMessage('Đang import dữ liệu...')

    try {
      const res = await fetch('/api/import-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Import thất bại.')
      } else {
        setMessage(
          `Import thành công. Đã thêm ${data.insertedCount} câu hỏi.`
        )
        setRows([])
      }
    } catch (error) {
      setMessage('Có lỗi khi gọi API import.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Import câu hỏi từ Excel/CSV</h1>

        <div className="border border-white/20 rounded-2xl p-6 mb-6">
          <p className="text-white/70 mb-4">
            File cần có các cột:
            <br />
            <span className="text-white">
              topic_slug, question, option_a, option_b, option_c, option_d,
              correct_option, explanation, sort_order, is_published
            </span>
          </p>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-white/80"
          />

          {fileName && (
            <div className="mt-3 text-sm text-white/60">
              File đã chọn: {fileName}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading || rows.length === 0}
              className="px-5 py-3 bg-white text-black rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Đang import...' : 'Import vào Supabase'}
            </button>
          </div>

          {message && (
            <div className="mt-4 text-sm text-white/80">{message}</div>
          )}
        </div>

        <div className="border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            Xem trước dữ liệu ({rows.length} dòng)
          </h2>

          {rows.length === 0 ? (
            <div className="text-white/60">Chưa có dữ liệu để xem trước.</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 pr-4">topic_slug</th>
                    <th className="py-2 pr-4">question</th>
                    <th className="py-2 pr-4">correct_option</th>
                    <th className="py-2 pr-4">sort_order</th>
                    <th className="py-2 pr-4">is_published</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((row, index) => (
                    <tr key={index} className="border-b border-white/5">
                      <td className="py-2 pr-4">{row.topic_slug}</td>
                      <td className="py-2 pr-4">{row.question}</td>
                      <td className="py-2 pr-4">{row.correct_option}</td>
                      <td className="py-2 pr-4">{row.sort_order ?? 0}</td>
                      <td className="py-2 pr-4">
                        {String(row.is_published ?? true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length > 20 && (
                <div className="mt-3 text-white/50 text-sm">
                  Chỉ hiển thị 20 dòng đầu để xem trước.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}