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
  initialNightDuration: number
  mayorRoleDuration: number
  mayorWordDuration: number
  narrationDuration: number
  findSeerDuration: number
  findWerewolfDuration: number
  filterDifficulty: 'all' | 'easy' | 'medium' | 'hard'
  selectedRoleIds: string[]
}

export interface CurrentGame {
  packIds: string[]
  word: Word // The selected word
  candidateWords?: Word[] // 2 words for Mayor to choose from
  startTime: number
  timerDuration: number
  roleIds: string[]
  mayorRoleId?: string
}

export interface Player {
  id: string;
  name: string;
  role: 'mayor' | 'werewolf' | 'seer' | 'villager';
  subRole?: 'werewolf' | 'seer' | 'villager';
  hasViewed: boolean;
}

export type TokenLimitMode = 'infinite' | 'many' | 'few';

export interface GroupGameSession {
  players: Player[];
  secretWord: string;
  candidateWords?: import("@/types").Word[];
  wordDifficulty: string;
  wordPackName: string;
  wordPackIds: string[];
  currentPlayerIndex: number;
  timerDuration: number;
  tokenLimitMode: TokenLimitMode;
  phase: 'role-reveal' | 'night' | 'day' | 'timer' | 'results';
}

export interface SavedPlayer {
  id: string;
  name: string;
  lastUsed: number;
}

export interface GroupPreset {
  id: string;
  name: string;
  playerNames: string[];
}
