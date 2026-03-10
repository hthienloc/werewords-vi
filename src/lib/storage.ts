import { WordPack, GameHistory, GameSettings } from "@/types";
import { DEFAULT_WORD_PACKS } from "./defaultData";

const KEYS = {
	WORD_PACKS: "werewords_wordpacks",
	HISTORY: "werewords_history",
	SETTINGS: "werewords_settings",
	INITIALIZED: "werewords_initialized_v3",
	SAVED_PLAYERS: "werewords_saved_players",
};

export function getWordPacks(): WordPack[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(KEYS.WORD_PACKS);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function saveWordPacks(packs: WordPack[]): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(KEYS.WORD_PACKS, JSON.stringify(packs));
}

export function getHistory(): GameHistory[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(KEYS.HISTORY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function saveHistory(history: GameHistory[]): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

export const DEFAULT_SETTINGS: GameSettings = {
	selectedPackIds: ["pack-food"],
	timerDuration: 180,
	initialNightDuration: 5,
	mayorRoleDuration: 5,
	mayorWordDuration: 10,
	narrationDuration: 8,
	findSeerDuration: 15,
	findWerewolfDuration: 60,
	filterDifficulty: "all",
	selectedRoleIds: ["role-seer", "role-werewolf", "role-villager"],
};

export function getSettings(): GameSettings {
	if (typeof window === "undefined") return DEFAULT_SETTINGS;
	try {
		const raw = localStorage.getItem(KEYS.SETTINGS);
		return raw
			? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
			: DEFAULT_SETTINGS;
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export function saveSettings(settings: GameSettings): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export function initializeDefaultData(): void {
	if (typeof window === "undefined") return;
	const initialized = localStorage.getItem(KEYS.INITIALIZED);
	if (!initialized) {
		saveWordPacks(DEFAULT_WORD_PACKS);
		localStorage.setItem(KEYS.INITIALIZED, "true");
	}
}

const SESSION_KEYS = {
	GROUP_SESSION: "werewords_group_session",
};

export function getGroupSession(): import("@/types").GroupGameSession | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = sessionStorage.getItem(SESSION_KEYS.GROUP_SESSION);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export function saveGroupSession(session: import("@/types").GroupGameSession): void {
	if (typeof window === "undefined") return;
	sessionStorage.setItem(SESSION_KEYS.GROUP_SESSION, JSON.stringify(session));
}

export function clearGroupSession(): void {
	if (typeof window === "undefined") return;
	sessionStorage.removeItem(SESSION_KEYS.GROUP_SESSION);
}

export function getSavedPlayers(): import("@/types").SavedPlayer[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(KEYS.SAVED_PLAYERS);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function saveSavedPlayers(players: import("@/types").SavedPlayer[]): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(KEYS.SAVED_PLAYERS, JSON.stringify(players));
}

export function addSavedPlayer(name: string): void {
	if (typeof window === "undefined" || !name.trim()) return;
	const players = getSavedPlayers();
	const trimmedName = name.trim();
	const existingIndex = players.findIndex(p => p.name.toLowerCase() === trimmedName.toLowerCase());
	
	if (existingIndex > -1) {
		players[existingIndex].lastUsed = Date.now();
		players[existingIndex].name = trimmedName; // Update casing if needed
	} else {
		players.push({
			id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `sp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
			name: trimmedName,
			lastUsed: Date.now()
		});
	}
	
	// Keep only top 20 most recent
	const sorted = players.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 20);
	saveSavedPlayers(sorted);
}
