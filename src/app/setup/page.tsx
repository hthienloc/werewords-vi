'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Navbar from '@/components/Navbar'

const TIMER_OPTIONS = [
  { label: '3 phút', value: 180 },
  { label: '4 phút', value: 240 },
  { label: '5 phút', value: 300 },
]

export default function SetupPage() {
  const { state, dispatch } = useApp()
  const router = useRouter()

  const [packId, setPackId] = useState(state.settings.selectedPackId)
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>(
    state.settings.filterDifficulty
  )
  const [timer, setTimer] = useState(state.settings.timerDuration)
  const [customTimer, setCustomTimer] = useState('')
  const [useCustom, setUseCustom] = useState(
    !TIMER_OPTIONS.find((o) => o.value === state.settings.timerDuration)
  )
  const [error, setError] = useState('')

  useEffect(() => {
    if (state.hydrated) {
      setPackId(state.settings.selectedPackId)
      setDifficulty(state.settings.filterDifficulty)
      setTimer(state.settings.timerDuration)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hydrated])

  const selectedPack = state.wordPacks.find((p) => p.id === packId)

  const availableWords = selectedPack
    ? selectedPack.words.filter(
        (w) => !w.used && (difficulty === 'all' || w.difficulty === difficulty)
      )
    : []

  function handleStart() {
    if (!selectedPack) {
      setError('Vui lòng chọn bộ từ.')
      return
    }
    if (availableWords.length === 0) {
      setError('Không có từ nào phù hợp với bộ lọc này.')
      return
    }

    const timerVal = useCustom ? parseInt(customTimer) * 60 : timer
    if (useCustom && (!customTimer || parseInt(customTimer) < 1)) {
      setError('Vui lòng nhập thời gian hợp lệ.')
      return
    }

    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)]

    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        selectedPackId: packId,
        filterDifficulty: difficulty,
        timerDuration: timerVal,
      },
    })

    dispatch({
      type: 'START_GAME',
      payload: {
        packId,
        word: randomWord,
        startTime: Date.now(),
        timerDuration: timerVal,
      },
    })

    router.push('/play')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Cài đặt ván chơi" backHref="/" />

      <div className="flex-1 px-5 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {/* Word pack selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Bộ từ
          </label>
          <select
            value={packId}
            onChange={(e) => {
              setPackId(e.target.value)
              setError('')
            }}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base appearance-none focus:outline-none focus:border-purple-500"
          >
            {state.wordPacks.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.emoji} {pack.name} ({pack.words.length} từ)
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Độ khó
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { label: '🎯 Tất cả', value: 'all' },
                { label: '🟢 Dễ', value: 'easy' },
                { label: '🟡 Trung bình', value: 'medium' },
                { label: '🔴 Khó', value: 'hard' },
              ] as { label: string; value: 'all' | 'easy' | 'medium' | 'hard' }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-colors border ${
                  difficulty === opt.value
                    ? 'bg-purple-700 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {availableWords.length} từ phù hợp
          </p>
        </div>

        {/* Timer selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Thời gian
          </label>
          <div className="flex gap-2 mb-2">
            {TIMER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setTimer(opt.value)
                  setUseCustom(false)
                  setError('')
                }}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors border ${
                  !useCustom && timer === opt.value
                    ? 'bg-purple-700 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUseCustom(true)
                setError('')
              }}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-colors border ${
                useCustom
                  ? 'bg-purple-700 border-purple-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300'
              }`}
            >
              Tùy chỉnh
            </button>
            {useCustom && (
              <input
                type="number"
                min="1"
                max="60"
                placeholder="Phút"
                value={customTimer}
                onChange={(e) => setCustomTimer(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-purple-500"
              />
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={availableWords.length === 0}
          className="w-full bg-purple-700 hover:bg-purple-600 active:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xl font-bold py-5 rounded-2xl transition-colors shadow-lg shadow-purple-900/40 mt-auto"
        >
          🎮 Bắt đầu
        </button>
      </div>
    </div>
  )
}
