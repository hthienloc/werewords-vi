'use client'

import Link from 'next/link'
import { useApp } from '@/context/AppContext'

export default function HomePage() {
  const { state } = useApp()

  const selectedPack = state.wordPacks.find(
    (p) => p.id === state.settings.selectedPackId
  )
  const remaining = selectedPack
    ? selectedPack.words.filter((w) => !w.used).length
    : 0

  return (
    <main className="flex flex-col min-h-screen items-center justify-center px-6 py-10">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <span className="text-7xl mb-3" role="img" aria-label="logo">
          🐺💬
        </span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Werewords
        </h1>
        <p className="text-purple-400 font-semibold text-lg mt-1">Việt Nam</p>
      </div>

      {/* Current pack info */}
      {selectedPack && (
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-center">
          <p className="text-gray-400 text-sm">Bộ từ hiện tại</p>
          <p className="text-white font-semibold mt-1">
            {selectedPack.emoji} {selectedPack.name}
          </p>
          <p className="text-purple-400 text-sm mt-1">{remaining} từ còn lại</p>
        </div>
      )}

      {/* Main actions */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        <Link
          href="/setup"
          className="w-full bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white text-xl font-bold py-5 rounded-2xl text-center transition-colors shadow-lg shadow-purple-900/40"
        >
          🎮 Bắt đầu ván mới
        </Link>

        <Link
          href="/words"
          className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-white text-lg font-semibold py-4 rounded-2xl text-center transition-colors border border-gray-700"
        >
          📚 Quản lý bộ từ
        </Link>

        <Link
          href="/history"
          className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-white text-lg font-semibold py-4 rounded-2xl text-center transition-colors border border-gray-700"
        >
          📜 Lịch sử ván chơi
        </Link>

        <Link
          href="/rules"
          className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-white text-lg font-semibold py-4 rounded-2xl text-center transition-colors border border-gray-700"
        >
          📖 Luật chơi
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-12 text-gray-600 text-xs">
        Companion app không chính thức cho Werewords
      </p>
    </main>
  )
}
