'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import DifficultyBadge from '@/components/DifficultyBadge'
import TimerDisplay from '@/components/TimerDisplay'
import { speak, setTTSEnabled } from '@/lib/tts'
import { playWarningBeep, playEndBeep } from '@/lib/audio'
import { GameHistory } from '@/types'
import { ALL_ROLES } from '@/lib/roles'

type Step =
  | 'start-night' // Initial step to unlock audio
  | 'night'
  | 'mayor-role'
  | 'mayor-role-end' // Brief pause/sleep after role pick
  | 'mayor-word'
  | 'narration'
  | 'night-end'
  | 'dawn'
  | 'timer'
  | 'result'

export default function PlayPage() {
  const { state, dispatch } = useApp()
  const router = useRouter()

  const [step, setStep] = useState<Step>('start-night')
  const [wordVisible, setWordVisible] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const [flash, setFlash] = useState(false)
  const [ttsOn, setTtsOn] = useState(true)
  const [result, setResult] = useState<'villagers' | 'werewolf' | null>(null)
  const [narrationIndex, setNarrationIndex] = useState(-1)
  const [isNarrationActive, setIsNarrationActive] = useState(false)

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

  // Interaction required to unlock audio API
  function handleStartNight() {
    speak('Bắt đầu ván chơi.')
    setStep('night')
  }

  // Step 1: Night falls — announce
  useEffect(() => {
    if (step === 'night') {
      speak('Đêm đã buông xuống. Mọi người hãy nhắm mắt lại.')
      const t = setTimeout(() => {
        speak('Mayor, hãy mở mắt và chọn vai trò bí mật của mình.')
        setStep('mayor-role')
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [step])

  // Step 1.5: Mayor role picked -> Pause then pick word
  useEffect(() => {
    if (step === 'mayor-role-end') {
      speak('Mayor, hãy nhắm mắt lại.')
      const t = setTimeout(() => {
        speak('Mayor, hãy mở mắt và chọn từ bí mật.')
        setStep('mayor-word')
      }, 5000)
      return () => clearTimeout(t)
    }
  }, [step])

  // Step 3: Role Narration Sequence
  useEffect(() => {
    if (step !== 'narration' || !currentGame) return

    const rolesToNarrate = ALL_ROLES.filter((r) => {
      if (!currentGame.roleIds.includes(r.id) || !r.nightDescription) return false

      // Special dependency: Seer/Fortune Teller doesn't wake if Mayor is that role
      if (r.id === 'role-seer' && currentGame.mayorRoleId === 'role-seer') return false
      if (r.id === 'role-fortune-teller' && currentGame.mayorRoleId === 'role-fortune-teller') return false

      // Apprentice only wakes if Mayor is Seer or Fortune Teller
      if (r.id === 'role-apprentice') {
        const mayorIsSeerLike =
          currentGame.mayorRoleId === 'role-seer' || currentGame.mayorRoleId === 'role-fortune-teller'
        if (!mayorIsSeerLike) return false
      }

      return true
    }).sort((a, b) => a.priority - b.priority)

    if (narrationIndex === -1) {
      // Start with Mayor sleep
      speak('Mayor, hãy nhắm mắt lại.')
      const t = setTimeout(() => setNarrationIndex(0), 4000)
      return () => clearTimeout(t)
    }

    if (narrationIndex < rolesToNarrate.length) {
      const role = rolesToNarrate[narrationIndex]
      setIsNarrationActive(true)

      speak(role.nightDescription!)

      // Special content for Fortune Teller? (Mention letters)
      if (role.id === 'role-fortune-teller') {
        const firstLetters = currentGame.word.text
          .split(' ')
          .map((w) => w[0])
          .join(', ')
        speak(`Các chữ cái đầu tiên là: ${firstLetters}.`)
      }

      const t = setTimeout(() => {
        speak(`${role.name}, hãy nhắm mắt lại.`)
        const nextT = setTimeout(() => {
          setNarrationIndex(narrationIndex + 1)
          setIsNarrationActive(false)
        }, 4000)
        return () => clearTimeout(nextT)
      }, role.id === 'role-fortune-teller' ? 12000 : 8000)

      return () => clearTimeout(t)
    } else {
      // All done, go to night-end
      setStep('night-end')
    }
  }, [step, narrationIndex, currentGame])

  // Step 4: End of night
  useEffect(() => {
    if (step === 'night-end') {
      speak('Mọi người hãy mở mắt ra. Bình minh đã đến.')
      const t = setTimeout(() => setStep('dawn'), 3000)
      return () => clearTimeout(t)
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
    setStep('narration')
    setNarrationIndex(-1)
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

      {/* ── STEP 0: Manual Start to unlock audio ── */}
      {step === 'start-night' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
          <div className="text-8xl animate-bounce">🌙</div>
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Sẵn sàng?</h2>
            <p className="text-gray-400 text-lg">Nhấn nút bên dưới để bắt đầu ván chơi.</p>
          </div>
          <button
            onClick={handleStartNight}
            className="bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-lg shadow-purple-900/40 transition-all transform active:scale-95"
          >
            🔥 Bắt đầu Ngay
          </button>
        </div>
      )}

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
        </div>
      )}

      {/* ── STEP 1.5: Mayor Secret Role ── */}
      {step === 'mayor-role' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="text-6xl">🎭</div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Mayor</h2>
            <p className="text-gray-300 text-lg">
              Hãy chọn vai trò bí mật của bạn (lá bài ở giữa).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {ALL_ROLES.filter(r => ['role-seer', 'role-werewolf', 'role-villager', 'role-fortune-teller', 'role-apprentice', 'role-minion'].includes(r.id)).map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  dispatch({ type: 'SET_MAYOR_ROLE', payload: role.id })
                  setStep('mayor-role-end')
                }}
                className="bg-gray-800 hover:bg-purple-700/40 border border-gray-700 hover:border-purple-500 rounded-xl py-4 px-3 flex flex-col items-center gap-1 transition-all"
              >
                <span className="text-2xl">{role.emoji}</span>
                <span className="text-sm font-bold text-white">{role.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 1.6: Mayor Transition ── */}
      {step === 'mayor-role-end' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
          <div className="text-6xl">🧘‍♂️</div>
          <h2 className="text-3xl font-extrabold text-white">Đang xử lý nội dung...</h2>
          <p className="text-gray-400">Đừng mở mắt nếu bạn không phải Mayor.</p>
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

      {/* ── STEP 3: Narration ── */}
      {step === 'narration' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
          <div className="text-8xl animate-pulse">🌙</div>
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Giai đoạn ban đêm</h2>
            {narrationIndex === -1 ? (
              <p className="text-gray-300 text-xl">Mayor đang đi ngủ...</p>
            ) : narrationIndex < (ALL_ROLES.filter(r => currentGame.roleIds.includes(r.id) && r.nightDescription).length) ? (
              <div>
                <span className="text-5xl mb-4 block">
                  {ALL_ROLES.find(r => r.id === ALL_ROLES.filter((r) => {
                    if (!currentGame.roleIds.includes(r.id) || !r.nightDescription) return false
                    if (r.id === 'role-seer' && currentGame.mayorRoleId === 'role-seer') return false
                    if (r.id === 'role-fortune-teller' && currentGame.mayorRoleId === 'role-fortune-teller') return false
                    if (r.id === 'role-apprentice') {
                      const mayorIsSeerLike = currentGame.mayorRoleId === 'role-seer' || currentGame.mayorRoleId === 'role-fortune-teller'
                      if (!mayorIsSeerLike) return false
                    }
                    return true
                  }).sort((a, b) => a.priority - b.priority)[narrationIndex].id)?.emoji}
                </span>
                <p className="text-purple-400 text-2xl font-bold">
                  {ALL_ROLES.filter((r) => {
                    if (!currentGame.roleIds.includes(r.id) || !r.nightDescription) return false
                    if (r.id === 'role-seer' && currentGame.mayorRoleId === 'role-seer') return false
                    if (r.id === 'role-fortune-teller' && currentGame.mayorRoleId === 'role-fortune-teller') return false
                    if (r.id === 'role-apprentice') {
                      const mayorIsSeerLike = currentGame.mayorRoleId === 'role-seer' || currentGame.mayorRoleId === 'role-fortune-teller'
                      if (!mayorIsSeerLike) return false
                    }
                    return true
                  }).sort((a,b)=>a.priority-b.priority)[narrationIndex].name}
                </p>
                <p className="text-gray-300 text-lg mt-2 italic">Đừng mở mắt nếu không phải vai trò này!</p>
              </div>
            ) : (
              <p className="text-gray-300 text-xl">Đang chuẩn bị bình minh...</p>
            )}
          </div>
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
