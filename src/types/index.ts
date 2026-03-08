export interface Word {
  id: string
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  used?: boolean
}

export interface GameRole {
  id: string
  name: string
  emoji: string
  description: string
  nightDescription?: string
  priority: number // Order of waking up at night
  count?: number
  isDefault?: boolean
  complexity: 'easy' | 'medium' | 'hard'
}

export interface WordPack {
  id: string
  name: string
  emoji: string
  words: Word[]
  isDefault?: boolean
}

export interface GameHistory {
  id: string
  date: string
  secretWord: string
  wordPackName: string
  difficulty: 'easy' | 'medium' | 'hard'
  result: 'villagers' | 'werewolf'
  duration: number
  timerDuration: number
}

export interface GameSettings {
  selectedPackIds: string[]
  timerDuration: number
  filterDifficulty: 'all' | 'easy' | 'medium' | 'hard'
  selectedRoleIds: string[]
}

export interface CurrentGame {
  packIds: string[]
  word: Word
  startTime: number
  timerDuration: number
  roleIds: string[]
  mayorRoleId?: string
}
