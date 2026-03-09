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

  function handleDeleteItem(id: string) {
    dispatch({ type: 'DELETE_HISTORY_ITEM', payload: id })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Navbar title="Lịch sử ván chơi" backHref="/" />

      <div className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Nhật ký</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              {state.history.length} ván đã chơi
            </p>
          </div>
          {state.history.length > 0 && (
            <button
              onClick={handleClear}
              className="group flex items-center gap-2 text-[10px] font-black text-red-500 hover:text-white transition-all uppercase tracking-widest border border-red-900/30 hover:border-red-600 px-4 py-2 rounded-full bg-red-950/20 hover:bg-red-600 shadow-lg shadow-red-900/20"
            >
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>

        {state.history.length === 0 && (
          <div className="text-center py-24 bg-gray-900/40 rounded-[2.5rem] border border-gray-800/50 backdrop-blur-sm">
            <div className="text-7xl mb-6 grayscale opacity-30">📜</div>
            <p className="text-gray-400 font-bold text-lg">Chưa có dữ liệu</p>
            <p className="text-gray-600 text-sm mt-1 max-w-[200px] mx-auto leading-relaxed">
              Các ván chơi của bạn sẽ được lưu giữ tại đây.
            </p>
          </div>
        )}

        <div className="grid gap-5">
          {state.history.map((entry) => (
            <div
              key={entry.id}
              className="group relative bg-gray-900/50 hover:bg-gray-900/80 border border-gray-800 rounded-[2rem] p-6 transition-all duration-300 hover:scale-[1.02] hover:border-purple-900/50 shadow-xl hover:shadow-purple-900/10"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-2xl ${
                    entry.result === 'villagers' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {entry.result === 'villagers' ? '🎉' : '🐺'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white leading-tight tracking-tight">
                      {entry.secretWord}
                    </h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">
                      <span className="text-purple-500/80 mr-1 opacity-70">📦</span> {entry.wordPackName}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <DifficultyBadge difficulty={entry.difficulty} />
                  <button
                    onClick={() => handleDeleteItem(entry.id)}
                    className="p-2.5 text-gray-700 hover:text-red-500 transition-all rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 active:scale-90"
                    title="Xóa ván này"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center border-t border-gray-800/50 pt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em]">Kết quả</span>
                  <span className={`text-xs font-black px-2 py-1 rounded-full inline-block ${
                    entry.result === 'villagers' ? 'text-green-400 bg-green-400/5' : 'text-red-400 bg-red-400/5'
                  }`}>
                    {entry.result === 'villagers' ? 'DÂN LÀNG' : 'MA SÓI'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-x border-gray-800/50 px-2">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em]">Thời gian</span>
                  <span className="text-xs font-black text-purple-400 bg-purple-400/5 py-1 rounded-full lowercase italic">
                    {formatDuration(entry.duration)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em]">Ngày chơi</span>
                  <span className="text-xs font-black text-gray-300 bg-gray-300/5 py-1 rounded-full">
                    {formatDate(entry.date).split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
