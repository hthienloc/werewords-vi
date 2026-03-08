'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import DifficultyBadge from '@/components/DifficultyBadge'
import TimerDisplay from '@/components/TimerDisplay'
import { speak, setTTSEnabled } from '@/lib/tts'
import { playWarningBeep, playEndBeep } from '@/lib/audio'
import { GameHistory } from '@/types'

type Step =
  | 'night'
  | 'mayor-word'
  | 'sleep'
  | 'dawn'
  | 'timer'
  | 'result'

export default function PlayPage() {
  const { state, dispatch } = useApp()
  const router = useRouter()

  const [step, setStep] = useState<Step>('night')
  const [wordVisible, setWordVisible] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const [flash, setFlash] = useState(false)
  const [ttsOn, setTtsOn] = useState(true)
  const [result, setResult] = useState<'villagers' | 'werewolf' | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const warningFiredRef = useRef(false)
  const endFiredRef = useRef(false)
  const durationRef = useRef(0)

  const currentGame = state.currentGame

  // Redirect if no game
  useEffect(() => {
    if (state.hydrated && !currentGame) {
      router.replace('/')
    }
  }, [state.hydrated, currentGame, router])

  // Step 1: Night falls — announce
  useEffect(() => {
    if (step === 'night') {
      speak('Tất cả mọi người nhắm mắt lại.')
    }
  }, [step])

  // Step 3: Mayor sleep
  useEffect(() => {
    if (step === 'sleep') {
      speak('Mayor, nhắm mắt lại.')
    }
  }, [step])

  // Step 4: Dawn — announce + auto proceed to timer after short delay
  useEffect(() => {
    if (step === 'dawn') {
      speak('Tất cả mọi người mở mắt. Bắt đầu đặt câu hỏi!')
      const t = setTimeout(() => {
        setStep('timer')
        setTimeLeft(currentGame?.timerDuration ?? 180)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [step, currentGame])

  // Wake lock for mayor word screen
  useEffect(() => {
    if (step === 'mayor-word') {
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then((lock) => {
          wakeLockRef.current = lock
        }).catch(() => {})
      }
    } else {
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [step])

  // Auto-hide word after 5s
  useEffect(() => {
    if (step === 'mayor-word' && wordVisible) {
      const t = setTimeout(() => setWordVisible(false), 5000)
      return () => clearTimeout(t)
    }
  }, [step, wordVisible])

  // Timer logic
  useEffect(() => {
    if (step !== 'timer') return

    if (paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1
        durationRef.current += 1

        if (next <= 30 && !warningFiredRef.current) {
          warningFiredRef.current = true
          playWarningBeep()
          setFlash(true)
          setTimeout(() => setFlash(false), 600)
        }

        if (next <= 0 && !endFiredRef.current) {
          endFiredRef.current = true
          playEndBeep()
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          setTimeout(() => setStep('result'), 1200)
          return 0
        }

        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [step, paused])

  // TTS sync
  function toggleTTS() {
    const next = !ttsOn
    setTtsOn(next)
    setTTSEnabled(next)
  }

  function handleRevealWord() {
    setWordVisible(true)
  }

  function handleWordSeen() {
    setWordVisible(false)
    setStep('sleep')
  }

  function handleSaveResult(r: 'villagers' | 'werewolf') {
    setResult(r)
    if (!currentGame) return

    const pack = state.wordPacks.find((p) => p.id === currentGame.packId)
    const entry: GameHistory = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      secretWord: currentGame.word.text,
      wordPackName: pack?.name ?? 'Không rõ',
      difficulty: currentGame.word.difficulty,
      result: r,
      duration: durationRef.current,
      timerDuration: currentGame.timerDuration,
    }

    dispatch({ type: 'ADD_HISTORY', payload: entry })
    dispatch({ type: 'END_GAME' })
  }

  function goHome() {
    router.push('/')
  }

  if (!currentGame) return null

  const isWarning = timeLeft <= 30 && timeLeft > 0

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${flash ? 'bg-red-900' : 'bg-gray-950'}`}>
      {/* TTS toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTTS}
          className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 transition-colors"
          aria-label={ttsOn ? 'Tắt giọng đọc' : 'Bật giọng đọc'}
        >
          {ttsOn ? (
            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── STEP 1: Night ── */}
      {step === 'night' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
          <div className="text-8xl animate-pulse">🌙</div>
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Đêm xuống</h2>
            <p className="text-gray-300 text-xl leading-relaxed">
              Tất cả mọi người<br />nhắm mắt lại.
            </p>
          </div>
          <button
            onClick={() => setStep('mayor-word')}
            className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-lg px-10 py-4 rounded-2xl mt-4 transition-colors"
          >
            Tiếp theo →
          </button>
        </div>
      )}

      {/* ── STEP 2: Mayor sees word ── */}
      {step === 'mayor-word' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="text-6xl">👑</div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Mayor</h2>
            <p className="text-gray-300 text-lg">
              Hãy mở mắt và xem từ bí mật.
            </p>
          </div>

          {!wordVisible ? (
            <button
              onClick={handleRevealWord}
              className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xl px-12 py-5 rounded-2xl transition-colors shadow-lg shadow-purple-900/50"
            >
              👁 Xem từ
            </button>
          ) : (
            <div className="w-full max-w-sm bg-gray-900 border border-purple-700 rounded-2xl px-6 py-8 flex flex-col items-center gap-4">
              <p className="text-gray-400 text-sm">Từ bí mật</p>
              <p className="text-5xl font-extrabold text-white text-center leading-tight">
                {currentGame.word.text}
              </p>
              <DifficultyBadge difficulty={currentGame.word.difficulty} size="md" />
              <p className="text-gray-500 text-xs mt-2">Tự động ẩn sau 5 giây</p>
            </div>
          )}

          <button
            onClick={handleWordSeen}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg px-10 py-4 rounded-2xl border border-gray-700 transition-colors"
          >
            ✅ Đã xem
          </button>
        </div>
      )}

      {/* ── STEP 3: Sleep ── */}
      {step === 'sleep' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
          <div className="text-8xl">😴</div>
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Mayor</h2>
            <p className="text-gray-300 text-xl">Nhắm mắt lại.</p>
          </div>
          <button
            onClick={() => setStep('dawn')}
            className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-lg px-10 py-4 rounded-2xl mt-4 transition-colors"
          >
            Tiếp theo →
          </button>
        </div>
      )}

      {/* ── STEP 4: Dawn ── */}
      {step === 'dawn' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
          <div className="text-8xl">☀️</div>
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Bình minh ló dạng</h2>
            <p className="text-gray-300 text-xl leading-relaxed">
              Tất cả mọi người mở mắt.<br />
              Bắt đầu đặt câu hỏi!
            </p>
          </div>
          <p className="text-purple-400 text-sm animate-pulse">Đồng hồ sắp bắt đầu...</p>
        </div>
      )}

      {/* ── STEP 5: Timer ── */}
      {step === 'timer' && (
        <div className={`flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 transition-colors duration-300 ${isWarning ? 'bg-red-950' : ''}`}>
          <TimerDisplay seconds={timeLeft} warning={isWarning} />

          {isWarning && (
            <p className="text-red-400 font-bold text-lg animate-pulse">
              ⚠️ Còn 30 giây!
            </p>
          )}

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setPaused((p) => !p)}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg px-8 py-4 rounded-2xl border border-gray-700 transition-colors"
            >
              {paused ? '▶ Tiếp tục' : '⏸ Dừng'}
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-400">
            Từ bí mật đã được Mayor xem
          </div>
        </div>
      )}

      {/* ── STEP 6: Time's up / Result ── */}
      {step === 'result' && result === null && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="text-7xl">⏰</div>
          <h2 className="text-3xl font-extrabold text-white">Hết giờ!</h2>
          <p className="text-gray-300 text-lg">Ai thắng ván này?</p>

          <div className="w-full max-w-sm flex flex-col gap-4 mt-4">
            <button
              onClick={() => handleSaveResult('villagers')}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
            >
              🎉 Dân làng đoán đúng
            </button>
            <button
              onClick={() => handleSaveResult('werewolf')}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
            >
              🐺 Ma sói thắng
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-400">
            Từ bí mật: <span className="text-white font-bold">{currentGame.word.text}</span>
          </div>
        </div>
      )}

      {/* Result saved confirmation */}
      {step === 'result' && result !== null && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="text-7xl">
            {result === 'villagers' ? '🎉' : '🐺'}
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            {result === 'villagers' ? 'Dân làng thắng!' : 'Ma sói thắng!'}
          </h2>
          <p className="text-gray-400">
            Từ bí mật: <span className="text-white font-bold">{currentGame.word.text}</span>
          </p>
          <p className="text-gray-500 text-sm">Kết quả đã được lưu</p>

          <button
            onClick={goHome}
            className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xl px-12 py-5 rounded-2xl mt-4 transition-colors"
          >
            🏠 Về trang chủ
          </button>
        </div>
      )}
    </div>
  )
}
