import { WordPack, GameHistory, GameSettings } from '@/types'
import { DEFAULT_WORD_PACKS } from './defaultData'

const KEYS = {
  WORD_PACKS: 'werewords_wordpacks',
  HISTORY: 'werewords_history',
  SETTINGS: 'werewords_settings',
  INITIALIZED: 'werewords_initialized',
}

export function getWordPacks(): WordPack[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEYS.WORD_PACKS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveWordPacks(packs: WordPack[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.WORD_PACKS, JSON.stringify(packs))
}

export function getHistory(): GameHistory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEYS.HISTORY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHistory(history: GameHistory[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history))
}

const DEFAULT_SETTINGS: GameSettings = {
  selectedPackId: 'pack-food',
  timerDuration: 180,
  filterDifficulty: 'all',
}

export function getSettings(): GameSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

export function initializeDefaultData(): void {
  if (typeof window === 'undefined') return
  const initialized = localStorage.getItem(KEYS.INITIALIZED)
  if (!initialized) {
    saveWordPacks(DEFAULT_WORD_PACKS)
    localStorage.setItem(KEYS.INITIALIZED, 'true')
  }
}
