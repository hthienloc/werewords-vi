export interface Word {
  id: string
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  used?: boolean
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
  selectedPackId: string
  timerDuration: number
  filterDifficulty: 'all' | 'easy' | 'medium' | 'hard'
}

export interface CurrentGame {
  packId: string
  word: Word
  startTime: number
  timerDuration: number
}
