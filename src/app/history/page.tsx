'use client'

import { useApp } from '@/context/AppContext'
import Navbar from '@/components/Navbar'
import DifficultyBadge from '@/components/DifficultyBadge'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function HistoryPage() {
  const { state, dispatch } = useApp()

  function handleClear() {
    if (confirm('Xóa toàn bộ lịch sử? Hành động không thể hoàn tác.')) {
      dispatch({ type: 'CLEAR_HISTORY' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Lịch sử ván chơi" backHref="/" />

      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400 text-sm">{state.history.length} ván</p>
          {state.history.length > 0 && (
            <button
              onClick={handleClear}
              className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
            >
              🗑 Xóa lịch sử
            </button>
          )}
        </div>

        {state.history.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📜</div>
            <p className="text-gray-500">Chưa có ván chơi nào được ghi lại.</p>
            <p className="text-gray-600 text-sm mt-2">
              Hoàn thành một ván chơi để xem lịch sử tại đây.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {state.history.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {entry.result === 'villagers' ? '🎉' : '🐺'}
                  </span>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">
                      {entry.secretWord}
                    </p>
                    <p className="text-gray-400 text-xs">{entry.wordPackName}</p>
                  </div>
                </div>
                <DifficultyBadge difficulty={entry.difficulty} />
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-800">
                <span>
                  {entry.result === 'villagers'
                    ? '✅ Dân làng thắng'
                    : '❌ Ma sói thắng'}
                </span>
                <span>⏱ {formatDuration(entry.duration)}</span>
                <span className="ml-auto">{formatDate(entry.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
