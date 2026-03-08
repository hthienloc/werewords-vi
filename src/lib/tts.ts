let enabled = true

export function speak(text: string): void {
  if (!enabled || typeof window === 'undefined') return

  const synth = window.speechSynthesis
  synth.cancel() // Stop any current speech

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'vi-VN'
  utter.rate = 1.0
  utter.pitch = 1.0

  const voices = synth.getVoices()
  
  const findVoice = () => {
    const availableVoices = synth.getVoices()
    return availableVoices.find((v) => v.lang === 'vi-VN' || v.lang === 'vi_VN') || 
           availableVoices.find((v) => v.lang.startsWith('vi'))
  }

  const viVoice = findVoice()
  if (viVoice) {
    utter.voice = viVoice
  }

  // If voices aren't loaded yet (can happen on some browsers), 
  // we try to speak anyway, the browser will use its default.
  // We also set a listener for voices changed for future calls.
  synth.speak(utter)
}

export function setTTSEnabled(val: boolean): void {
  enabled = val
}

export function isTTSEnabled(): boolean {
  return enabled
}
