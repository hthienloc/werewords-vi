"use client";

import React, {
	createContext,
	useContext,
	useReducer,
	useEffect,
	ReactNode,
} from "react";
import {
	WordPack,
	GameHistory,
	GameSettings,
	CurrentGame,
	Word,
} from "@/types";
import {
	getWordPacks,
	saveWordPacks,
	getHistory,
	saveHistory,
	getSettings,
	saveSettings,
	initializeDefaultData,
	DEFAULT_SETTINGS,
} from "@/lib/storage";

// ─── State ───────────────────────────────────────────────────────────────────

interface AppState {
	wordPacks: WordPack[];
	history: GameHistory[];
	settings: GameSettings;
	currentGame: CurrentGame | null;
	hydrated: boolean;
}

const initialState: AppState = {
	wordPacks: [],
	history: [],
	settings: DEFAULT_SETTINGS,
	currentGame: null,
	hydrated: false,
};

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
	| { type: "HYDRATE"; payload: Omit<AppState, "hydrated" | "currentGame"> }
	| { type: "SET_WORD_PACKS"; payload: WordPack[] }
	| { type: "ADD_WORD_PACK"; payload: WordPack }
	| { type: "UPDATE_WORD_PACK"; payload: WordPack }
	| { type: "DELETE_WORD_PACK"; payload: string }
	| { type: "ADD_WORD_TO_PACK"; payload: { packId: string; word: Word } }
	| {
			type: "UPDATE_WORD";
			payload: { packId: string; wordId: string; word: Partial<Word> };
	  }
	| { type: "DELETE_WORD"; payload: { packId: string; wordId: string } }
	| { type: "SET_HISTORY"; payload: GameHistory[] }
	| { type: "ADD_HISTORY"; payload: GameHistory }
	| { type: "CLEAR_HISTORY" }
	| { type: "SET_SETTINGS"; payload: GameSettings }
	| { type: "UPDATE_SETTINGS"; payload: Partial<GameSettings> }
	| { type: "START_GAME"; payload: CurrentGame }
	| { type: "SET_MAYOR_ROLE"; payload: string }
	| { type: "END_GAME" }
	| { type: "DELETE_HISTORY_ITEM"; payload: string };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
	switch (action.type) {
		case "HYDRATE":
			return { ...state, ...action.payload, hydrated: true };

		case "SET_WORD_PACKS":
			return { ...state, wordPacks: action.payload };

		case "ADD_WORD_PACK":
			return {
				...state,
				wordPacks: [...state.wordPacks, action.payload],
			};

		case "UPDATE_WORD_PACK":
			return {
				...state,
				wordPacks: state.wordPacks.map((p) =>
					p.id === action.payload.id ? action.payload : p
				),
			};

		case "DELETE_WORD_PACK":
			return {
				...state,
				wordPacks: state.wordPacks.filter(
					(p) => p.id !== action.payload
				),
			};

		case "ADD_WORD_TO_PACK":
			return {
				...state,
				wordPacks: state.wordPacks.map((p) =>
					p.id === action.payload.packId
						? { ...p, words: [...p.words, action.payload.word] }
						: p
				),
			};

		case "UPDATE_WORD":
			return {
				...state,
				wordPacks: state.wordPacks.map((p) =>
					p.id === action.payload.packId
						? {
								...p,
								words: p.words.map((w) =>
									w.id === action.payload.wordId
										? { ...w, ...action.payload.word }
										: w
								),
							}
						: p
				),
			};

		case "DELETE_WORD":
			return {
				...state,
				wordPacks: state.wordPacks.map((p) =>
					p.id === action.payload.packId
						? {
								...p,
								words: p.words.filter(
									(w) => w.id !== action.payload.wordId
								),
							}
						: p
				),
			};

		case "SET_HISTORY":
			return { ...state, history: action.payload };

		case "ADD_HISTORY":
			return { ...state, history: [action.payload, ...state.history] };

		case "CLEAR_HISTORY":
			return { ...state, history: [] };

		case "DELETE_HISTORY_ITEM":
			return {
				...state,
				history: state.history.filter((h) => h.id !== action.payload),
			};

		case "SET_SETTINGS":
			return { ...state, settings: action.payload };

		case "UPDATE_SETTINGS":
			return {
				...state,
				settings: { ...state.settings, ...action.payload },
			};

		case "START_GAME":
			return { ...state, currentGame: action.payload };

		case "SET_MAYOR_ROLE":
			return {
				...state,
				currentGame: state.currentGame
					? { ...state.currentGame, mayorRoleId: action.payload }
					: null,
			};

		case "END_GAME":
			return { ...state, currentGame: null };

		default:
			return state;
	}
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextValue {
	state: AppState;
	dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(reducer, initialState);

	useEffect(() => {
		initializeDefaultData();
		dispatch({
			type: "HYDRATE",
			payload: {
				wordPacks: getWordPacks(),
				history: getHistory(),
				settings: getSettings(),
			},
		});
	}, []);

	// Persist to localStorage whenever state changes (after hydration)
	useEffect(() => {
		if (!state.hydrated) return;
		saveWordPacks(state.wordPacks);
	}, [state.wordPacks, state.hydrated]);

	useEffect(() => {
		if (!state.hydrated) return;
		saveHistory(state.history);
	}, [state.history, state.hydrated]);

	useEffect(() => {
		if (!state.hydrated) return;
		saveSettings(state.settings);
	}, [state.settings, state.hydrated]);

	return (
		<AppContext.Provider value={{ state, dispatch }}>
			{children}
		</AppContext.Provider>
	);
}

export function useApp() {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error("useApp must be used within AppProvider");
	return ctx;
}
