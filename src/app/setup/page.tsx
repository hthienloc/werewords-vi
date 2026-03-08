'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Navbar from '@/components/Navbar'
import { ALL_ROLES } from '@/lib/roles'
import { GameRole } from '@/types'

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
  const [isTestSpeaking, setIsTestSpeaking] = useState(false)
  const [useCustom, setUseCustom] = useState(
    !TIMER_OPTIONS.find((o) => o.value === state.settings.timerDuration)
  )
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    state.settings.selectedRoleIds || []
  )
  const [playerCount, setPlayerCount] = useState(6)
  const [roleComplexity, setRoleComplexity] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [error, setError] = useState('')

  useEffect(() => {
    if (state.hydrated) {
      setPackId(state.settings.selectedPackId)
      setDifficulty(state.settings.filterDifficulty)
      setTimer(state.settings.timerDuration)
      setSelectedRoleIds(state.settings.selectedRoleIds || [])
      setRoleComplexity(
        (state.settings.selectedRoleIds || []).some(id => 
          ALL_ROLES.find(r => r.id === id)?.complexity === 'hard'
        ) ? 'hard' : 
        (state.settings.selectedRoleIds || []).some(id => 
          ALL_ROLES.find(r => r.id === id)?.complexity === 'medium'
        ) ? 'medium' : 'easy'
      )
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

    if (selectedRoleIds.length === 0) {
      setError('Vui lòng chọn ít nhất một nhân vật (vai trò).')
      return
    }

    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)]

    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        selectedPackId: packId,
        filterDifficulty: difficulty,
        timerDuration: timerVal,
        selectedRoleIds,
      },
    })

    dispatch({
      type: 'START_GAME',
      payload: {
        packId,
        word: randomWord,
        startTime: Date.now(),
        timerDuration: timerVal,
        roleIds: selectedRoleIds,
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

        {/* Player Count & Word Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Số người chơi
            </label>
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl px-2 py-1">
              <button 
                onClick={() => setPlayerCount(Math.max(3, playerCount - 1))}
                className="p-2 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <span className="flex-1 text-center font-bold text-lg text-white">{playerCount}</span>
              <button 
                onClick={() => setPlayerCount(Math.min(20, playerCount + 1))}
                className="p-2 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Độ khó từ
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base appearance-none focus:outline-none focus:border-purple-500"
            >
              <option value="all">🎯 Tất cả</option>
              <option value="easy">🟢 Dễ</option>
              <option value="medium">🟡 Trung bình</option>
              <option value="hard">🔴 Khó</option>
            </select>
          </div>
        </div>

        {/* Role selection - Card Grid Style like the image */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <label className="block text-sm font-semibold text-gray-300">
              Nhân vật (Vai trò)
            </label>
            <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1 gap-1">
              {(['easy', 'medium', 'hard'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setRoleComplexity(c)
                    // Auto select common roles for this complexity
                    const recommended = ALL_ROLES.filter(r => 
                      c === 'easy' ? r.complexity === 'easy' :
                      c === 'medium' ? (r.complexity === 'easy' || r.complexity === 'medium') : true
                    ).map(r => r.id)
                    setSelectedRoleIds(recommended)
                  }}
                  className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${
                    roleComplexity === c 
                      ? 'bg-purple-700 text-white' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {c === 'easy' ? 'Dễ' : c === 'medium' ? 'Vừa' : 'Khó'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {ALL_ROLES.map((role) => {
              const isSelected = selectedRoleIds.includes(role.id)
              return (
                <button
                  key={role.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== role.id))
                    } else {
                      setSelectedRoleIds([...selectedRoleIds, role.id])
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center pt-5 pb-3 px-1 rounded-xl transition-all border group overflow-hidden ${
                    isSelected
                      ? 'bg-purple-900/40 border-purple-500'
                      : 'bg-gray-800 border-gray-700 grayscale opacity-60'
                  }`}
                >
                  {/* Status indicator */}
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isSelected ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-gray-600'}`}></div>
                  
                  <span className="text-4xl mb-2 transition-transform group-hover:scale-110 duration-300">
                    {role.emoji}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider text-center px-1 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                    {role.name}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-gray-500 mt-2 italic">
            Chạm vào vai trò để thêm hoặc bớt khỏi ván chơi.
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

        <div className="flex gap-3 mt-auto">
          <button
            onClick={() => {
              const { speak } = require('@/lib/tts')
              setIsTestSpeaking(true)
              speak('Kiểm tra âm thanh. Bạn có nghe rõ không?')
              setTimeout(() => setIsTestSpeaking(false), 3000)
            }}
            disabled={isTestSpeaking}
            className={`flex-1 font-semibold py-5 rounded-2xl border transition-all ${
              isTestSpeaking 
                ? 'bg-purple-900/40 border-purple-500 text-purple-300 animate-pulse' 
                : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-gray-300 border-gray-700'
            }`}
          >
            {isTestSpeaking ? '🔊 Đang phát...' : '🔊 Thử tiếng'}
          </button>
          <button
            onClick={handleStart}
            disabled={availableWords.length === 0}
            className="flex-[2] bg-purple-700 hover:bg-purple-600 active:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xl font-bold py-5 rounded-2xl transition-colors shadow-lg shadow-purple-900/40"
          >
            🎮 Bắt đầu
          </button>
        </div>
      </div>
    </div>
  )
}
