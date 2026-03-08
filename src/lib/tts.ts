let enabled = true

export function speak(text: string): void {
  if (!enabled || typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'vi-VN'
  utter.rate = 0.9
  const voices = window.speechSynthesis.getVoices()
  const viVoice = voices.find((v) => v.lang.startsWith('vi'))
  if (viVoice) utter.voice = viVoice
  window.speechSynthesis.speak(utter)
}

export function setTTSEnabled(val: boolean): void {
  enabled = val
}

export function isTTSEnabled(): boolean {
  return enabled
}
