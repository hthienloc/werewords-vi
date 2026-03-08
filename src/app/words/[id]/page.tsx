'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Navbar from '@/components/Navbar'
import DifficultyBadge from '@/components/DifficultyBadge'
import { Word } from '@/types'

export default function WordPackDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch } = useApp()
  const router = useRouter()

  const pack = state.wordPacks.find((p) => p.id === id)

  const [newText, setNewText] = useState('')
  const [newDifficulty, setNewDifficulty] = useState<Word['difficulty']>('easy')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editDifficulty, setEditDifficulty] = useState<Word['difficulty']>('easy')
  const importRef = useRef<HTMLInputElement>(null)

  if (!pack) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-400">Không tìm thấy bộ từ.</p>
        <button onClick={() => router.push('/words')} className="mt-4 text-purple-400 underline">
          Quay lại
        </button>
      </div>
    )
  }

  function handleAddWord() {
    if (!newText.trim()) return
    const word: Word = {
      id: crypto.randomUUID(),
      text: newText.trim(),
      difficulty: newDifficulty,
    }
    dispatch({ type: 'ADD_WORD_TO_PACK', payload: { packId: id, word } })
    setNewText('')
  }

  function handleDeleteWord(wordId: string) {
    dispatch({ type: 'DELETE_WORD', payload: { packId: id, wordId } })
  }

  function startEdit(word: Word) {
    setEditId(word.id)
    setEditText(word.text)
    setEditDifficulty(word.difficulty)
  }

  function saveEdit() {
    if (!editId || !editText.trim()) return
    dispatch({
      type: 'UPDATE_WORD',
      payload: {
        packId: id,
        wordId: editId,
        word: { text: editText.trim(), difficulty: editDifficulty },
      },
    })
    setEditId(null)
  }

  function handleExport() {
    if (!pack) return
    const json = JSON.stringify(pack, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pack.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        let words: Word[] = []

        if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter(Boolean)
          words = lines.slice(1).map((line) => {
            const parts = line.split(',')
            return {
              id: crypto.randomUUID(),
              text: parts[0]?.trim().replace(/^"|"$/g, '') ?? '',
              difficulty: (['easy', 'medium', 'hard'].includes(parts[1]?.trim())
                ? parts[1].trim()
                : 'easy') as Word['difficulty'],
            }
          })
        } else {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            words = parsed.map((item) => ({
              id: crypto.randomUUID(),
              text: String(item.text ?? item),
              difficulty: (['easy', 'medium', 'hard'].includes(item.difficulty)
                ? item.difficulty
                : 'easy') as Word['difficulty'],
            }))
          } else if (parsed.words) {
            words = parsed.words.map((item: Word) => ({
              ...item,
              id: crypto.randomUUID(),
            }))
          }
        }

        const validWords = words.filter((w) => w.text)
        validWords.forEach((word) => {
          dispatch({ type: 'ADD_WORD_TO_PACK', payload: { packId: id, word } })
        })
        alert(`Đã nhập ${validWords.length} từ`)
      } catch {
        alert('Không thể đọc file. Kiểm tra định dạng JSON hoặc CSV.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title={`${pack.emoji} ${pack.name}`} backHref="/words" />

      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full flex flex-col gap-5">
        {/* Stats & actions */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">{pack.words.length} từ</p>
          <div className="flex gap-2">
            <button
              onClick={() => importRef.current?.click()}
              className="text-xs text-gray-300 bg-gray-800 border border-gray-700 px-3 py-2 rounded-xl hover:bg-gray-700 transition-colors"
            >
              📥 Nhập
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={handleExport}
              className="text-xs text-gray-300 bg-gray-800 border border-gray-700 px-3 py-2 rounded-xl hover:bg-gray-700 transition-colors"
            >
              📤 Xuất JSON
            </button>
          </div>
        </div>

        {/* Add word form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-300 mb-3">Thêm từ mới</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              placeholder="Nhập từ..."
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
            />
            <select
              value={newDifficulty}
              onChange={(e) => setNewDifficulty(e.target.value as Word['difficulty'])}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-purple-500"
            >
              <option value="easy">Dễ</option>
              <option value="medium">TB</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          <button
            onClick={handleAddWord}
            disabled={!newText.trim()}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            + Thêm từ
          </button>
        </div>

        {/* Word list */}
        <div className="flex flex-col gap-2">
          {pack.words.length === 0 && (
            <p className="text-gray-500 text-center py-8 text-sm">
              Bộ từ trống. Thêm từ hoặc nhập từ file.
            </p>
          )}
          {pack.words.map((word) => (
            <div
              key={word.id}
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3"
            >
              {editId === word.id ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value as Word['difficulty'])}
                    className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-2 text-sm"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">TB</option>
                    <option value="hard">Khó</option>
                  </select>
                  <button onClick={saveEdit} className="text-green-400 text-sm px-2">✓</button>
                  <button onClick={() => setEditId(null)} className="text-gray-500 text-sm px-2">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-white font-medium">{word.text}</span>
                  <DifficultyBadge difficulty={word.difficulty} />
                  <button
                    onClick={() => startEdit(word)}
                    className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                    aria-label="Sửa"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteWord(word.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    aria-label="Xóa"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
