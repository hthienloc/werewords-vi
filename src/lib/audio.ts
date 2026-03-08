export function playBeep(
  frequency = 880,
  duration = 0.3,
  type: OscillatorType = 'sine'
): void {
  if (typeof window === 'undefined') return
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = frequency
    osc.type = type
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
    osc.onended = () => ctx.close()
  } catch {
    // AudioContext not available
  }
}

export function playWarningBeep(): void {
  playBeep(660, 0.2)
  setTimeout(() => playBeep(660, 0.2), 300)
  setTimeout(() => playBeep(880, 0.4), 600)
}

export function playEndBeep(): void {
  playBeep(440, 0.3)
  setTimeout(() => playBeep(330, 0.3), 400)
  setTimeout(() => playBeep(220, 0.6), 800)
}
