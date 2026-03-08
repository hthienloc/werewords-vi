'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import Navbar from '@/components/Navbar'
import { WordPack } from '@/types'
import { DEFAULT_WORD_PACKS } from '@/lib/defaultData'

export default function WordsPage() {
  const { state, dispatch } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('📦')
  const [error, setError] = useState('')

  function handleCreate() {
    if (!newName.trim()) {
      setError('Vui lòng nhập tên bộ từ.')
      return
    }
    const pack: WordPack = {
      id: `pack-${crypto.randomUUID()}`,
      name: newName.trim(),
      emoji: newEmoji.trim() || '📦',
      words: [],
      isDefault: false,
    }
    dispatch({ type: 'ADD_WORD_PACK', payload: pack })
    setNewName('')
    setNewEmoji('📦')
    setShowCreate(false)
    setError('')
  }

  function handleDelete(id: string) {
    if (confirm('Xóa bộ từ này? Hành động không thể hoàn tác.')) {
      dispatch({ type: 'DELETE_WORD_PACK', payload: id })
    }
  }

  function handleReset(id: string) {
    const defaultPack = DEFAULT_WORD_PACKS.find((p) => p.id === id)
    if (!defaultPack) return
    if (confirm('Khôi phục bộ từ mặc định? Mọi chỉnh sửa sẽ bị xóa.')) {
      dispatch({ type: 'UPDATE_WORD_PACK', payload: defaultPack })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Quản lý bộ từ" backHref="/" />

      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-400 text-sm">
            {state.wordPacks.length} bộ từ
          </h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Tạo mới
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6">
              <h3 className="text-lg font-bold text-white mb-4">Tạo bộ từ mới</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  maxLength={4}
                  placeholder="📦"
                  className="w-16 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-3 text-center text-xl focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    setError('')
                  }}
                  placeholder="Tên bộ từ"
                  className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm mb-3">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreate(false)
                    setError('')
                  }}
                  className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 bg-purple-700 hover:bg-purple-600 text-white py-3 rounded-xl font-semibold"
                >
                  Tạo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pack list */}
        <div className="flex flex-col gap-3">
          {state.wordPacks.map((pack) => (
            <div
              key={pack.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <Link
                href={`/words/${pack.id}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-gray-800 transition-colors"
              >
                <span className="text-3xl">{pack.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{pack.name}</p>
                  <p className="text-gray-400 text-sm">{pack.words.length} từ</p>
                </div>
                {pack.isDefault && (
                  <span className="text-xs text-purple-400 bg-purple-900/40 border border-purple-800 px-2 py-1 rounded-full">
                    Mặc định
                  </span>
                )}
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="flex border-t border-gray-800">
                {pack.isDefault && (
                  <button
                    onClick={() => handleReset(pack.id)}
                    className="flex-1 text-gray-400 hover:text-yellow-400 text-xs py-2 transition-colors"
                  >
                    🔄 Khôi phục
                  </button>
                )}
                {!pack.isDefault && (
                  <button
                    onClick={() => handleDelete(pack.id)}
                    className="flex-1 text-gray-400 hover:text-red-400 text-xs py-2 transition-colors"
                  >
                    🗑 Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {state.wordPacks.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            Chưa có bộ từ nào. Tạo bộ từ mới để bắt đầu.
          </p>
        )}
      </div>
    </div>
  )
}
