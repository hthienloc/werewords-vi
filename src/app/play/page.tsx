"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import DifficultyBadge from "@/components/DifficultyBadge";
import TimerDisplay from "@/components/TimerDisplay";
import { speak, setTTSEnabled } from "@/lib/tts";
import {
	playWarningBeep,
	playEndBeep,
	initAudio,
	playSleepChime,
	playWakeChime,
} from "@/lib/audio";
import { GameHistory, CurrentGame, GameRole } from "@/types";
import { ALL_ROLES } from "@/lib/roles";

// Sub-components
import FourWayReveal from "./components/FourWayReveal";
import MayorRolePhase from "./components/MayorRolePhase";
import MayorWordPhase from "./components/MayorWordPhase";
import NarrationPhase from "./components/NarrationPhase";
import TimerPhase from "./components/TimerPhase";
import ResultPhase from "./components/ResultPhase";
import EndgamePhase from "./components/EndgamePhase";

// Roles that need to see the secret word during narration
const WORD_ROLES = new Set([
	"role-seer",
	"role-fortune-teller",
	"role-apprentice",
	"role-werewolf",
]);

/** Returns the ordered list of roles that need to be narrated for this game. */
function getActiveRoles(game: CurrentGame): GameRole[] {
	return ALL_ROLES.filter((r) => {
		if (!game.roleIds.includes(r.id) || !r.nightDescription) return false;
		if (r.id === "role-seer" && game.mayorRoleId === "role-seer")
			return false;
		if (
			r.id === "role-fortune-teller" &&
			game.mayorRoleId === "role-fortune-teller"
		)
			return false;
		if (r.id === "role-apprentice") {
			const mayorIsSeer =
				game.mayorRoleId === "role-seer" ||
				game.mayorRoleId === "role-fortune-teller";
			if (!mayorIsSeer) return false;
		}
		return true;
	}).sort((a, b) => a.priority - b.priority);
}

type Step =
	| "start-night" // Initial step to unlock audio
	| "night"
	| "mayor-role"
	| "mayor-word"
	| "mayor-sleep"
	| "narration"
	| "night-end"
	| "dawn"
	| "timer"
	| "find-seer"      // New: Word guessed, Werewolves find Seer
	| "find-werewolf"  // New: Time up, Villagers find Werewolf
	| "result";

export default function PlayPage() {
	const { state, dispatch } = useApp();
	const router = useRouter();

	const [step, setStep] = useState<Step>("night");
	const [wordVisible, setWordVisible] = useState(false);
	const [timeLeft, setTimeLeft] = useState(0);
	const [endgameTimeLeft, setEndgameTimeLeft] = useState(0);
	const [endgameNarrating, setEndgameNarrating] = useState(false);
	const lastSpokenRef = useRef<number>(-1);
	const halfTimeReportedRef = useRef(false);
	const oneMinuteReportedRef = useRef(false);
	const [paused, setPaused] = useState(false);
	const [flash, setFlash] = useState(false);
	const [ttsOn, setTtsOn] = useState(true);
	const [result, setResult] = useState<"villagers" | "werewolf" | null>(null);
	const [narrationIndex, setNarrationIndex] = useState(-1);
	const [narrationPhase, setNarrationPhase] = useState<"waking" | "sleeping">(
		"waking"
	);

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const endgameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const wakeLockRef = useRef<WakeLockSentinel | null>(null);
	const warningFiredRef = useRef(false);
	const endFiredRef = useRef(false);
	const durationRef = useRef(0);
	const [revealProgress, setRevealProgress] = useState(100);
	const [selectionProgress, setSelectionProgress] = useState(100);

	const currentGame = state.currentGame;

	// Redirect if no game
	useEffect(() => {
		if (state.hydrated && !currentGame) {
			router.replace("/");
		}
	}, [state.hydrated, currentGame, router]);


	useEffect(() => {
		if (step === "night") {
			import("@/lib/audio").then((m) => m.playSleepChime());
			speak("Đêm xuống. Tất cả mọi người nhắm mắt lại.", () => {
				setTimeout(() => {
					setStep("mayor-role");
				}, state.settings.initialNightDuration * 1000);
			});
		}
	}, [step]);

	// Step 1.5: Thị trưởng role - auto pick or delay
	useEffect(() => {
		if (step === "mayor-role") {
			speak("Thị trưởng mở mắt, hãy xem vai trò bí mật của bạn.", () => {
				setSelectionProgress(100);
				const start = Date.now();
				const duration = state.settings.mayorRoleDuration * 1000;
				const interval = setInterval(() => {
					const elapsed = Date.now() - start;
					const remaining = Math.max(
						0,
						100 - (elapsed / duration) * 100
					);
					setSelectionProgress(remaining);
					if (elapsed >= duration) {
						clearInterval(interval);
						setStep("mayor-word");
					}
				}, 50);
				return () => clearInterval(interval);
			});
		}
	}, [step, state.settings.mayorRoleDuration]);


	useEffect(() => {
		if (step === "mayor-word") {
			if (!currentGame) return;
			setWordVisible(true);
			setRevealProgress(100);

			speak("Thị trưởng hãy chọn một trong hai từ để bắt đầu.", () => {
				const start = Date.now();
				const duration = state.settings.mayorWordDuration * 1000;

				const interval = setInterval(() => {
					const elapsed = Date.now() - start;
					const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
					setRevealProgress(remaining);
					if (elapsed >= duration) {
						clearInterval(interval);
						setWordVisible(false);
						speak("Thị trưởng hãy nhắm mắt lại.", () => {
							setStep("mayor-sleep");
						});
					}
				}, 50);
				return () => clearInterval(interval);
			});
		}
	}, [step, state.settings.mayorWordDuration]);

	// Step 2.5: Mayor Sleeping Phase Transition
	useEffect(() => {
		if (step === "mayor-sleep") {
			const timeout = setTimeout(() => {
				setStep("narration");
				setNarrationIndex(-1);
				setNarrationPhase("waking");
			}, 2000);
			return () => clearTimeout(timeout);
		}
	}, [step]);

	// Step 3: Role Narration Sequence
	useEffect(() => {
		if (step !== "narration" || !currentGame) return;
		const roles = getActiveRoles(currentGame);

		// Start first role narration directly after mayor word
		if (narrationIndex === -1) {
			setNarrationIndex(0);
			setNarrationPhase("waking");
			return;
		}

		// Role is now active → speak the description and auto-advance
		if (narrationIndex < roles.length && narrationPhase === "waking") {
			const role = roles[narrationIndex];
			let text = role.nightDescription!;
			if (role.id === "role-fortune-teller") {
				const letters = currentGame.word.text
					.split(" ")
					.map((w) => w[0])
					.join(", ");
				text += ` Chữ cái đầu là ${letters}.`;
			}

			speak(text, () => {
				// Start countdown for the role's action time
				setSelectionProgress(100);
				const startSnapshot = Date.now();
				const duration = state.settings.narrationDuration * 1000;
				const interval = setInterval(() => {
					const elapsed = Date.now() - startSnapshot;
					const remaining = Math.max(
						0,
						100 - (elapsed / duration) * 100
					);
					setSelectionProgress(remaining);
					
					if (elapsed >= duration) {
						clearInterval(interval);
						setNarrationPhase("sleeping");
					}
				}, 50);
				return () => clearInterval(interval);
			});
		}

		// Role sleeping → move to next
		if (narrationIndex < roles.length && narrationPhase === "sleeping") {
			const role = roles[narrationIndex];
			speak(`${role.name} nhắm mắt.`, () => {
				setTimeout(() => {
					const next = narrationIndex + 1;
					if (next >= roles.length) {
						setStep("night-end");
					} else {
						setNarrationIndex(next);
						setNarrationPhase("waking");
					}
				}, 2000);
			});
		}
	}, [step, narrationIndex, narrationPhase, currentGame]);

	// Step 4: End of night
	useEffect(() => {
		if (step === "night-end") {
			setStep("dawn");
		}
	}, [step]);

	// Step 4: Dawn — announce + auto proceed to timer
	useEffect(() => {
		if (step === "dawn") {
			import("@/lib/audio").then((m) => m.playWakeChime());
			speak("Mọi người hãy mở mắt. Bình minh đã tới, hãy bắt đầu đặt câu hỏi cho Thị trưởng.", () => {
				setStep("timer");
				setTimeLeft(currentGame?.timerDuration ?? 180);
			});
		}
	}, [step, currentGame]);

	// Wake lock for mayor word screen
	useEffect(() => {
		if (step === "mayor-word") {
			if ("wakeLock" in navigator) {
				navigator.wakeLock
					.request("screen")
					.then((lock) => {
						wakeLockRef.current = lock;
					})
					.catch(() => {});
			}
		} else {
			wakeLockRef.current?.release().catch(() => {});
			wakeLockRef.current = null;
		}
	}, [step]);

	// Auto-hide word after 5s
	useEffect(() => {
		if (step === "mayor-word" && wordVisible) {
			const t = setTimeout(() => setWordVisible(false), 5000);
			return () => clearTimeout(t);
		}
	}, [step, wordVisible]);

	// Timer logic
	useEffect(() => {
		if (step !== "timer" || !currentGame) return;

		if (paused) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		// Reset notification refs when timer starts or resets
		halfTimeReportedRef.current = false;
		oneMinuteReportedRef.current = false;

		intervalRef.current = setInterval(() => {
			setTimeLeft((prev) => {
				const next = Math.max(0, prev - 1);
				durationRef.current += 1;

				// Notification: Half time
				const halfTime = Math.floor(currentGame.timerDuration / 2);
				if (
					next === halfTime &&
					!halfTimeReportedRef.current &&
					currentGame.timerDuration > 40
				) {
					speak("Đã hết nửa thời gian.");
					halfTimeReportedRef.current = true;
				}

				// Notification: 1 minute remaining
				if (
					next === 60 &&
					!oneMinuteReportedRef.current &&
					currentGame.timerDuration > 90
				) {
					speak("Còn 1 phút.");
					oneMinuteReportedRef.current = true;
				}

				if (next <= 30 && !warningFiredRef.current) {
					warningFiredRef.current = true;
					playWarningBeep();
					setFlash(true);
					setTimeout(() => setFlash(false), 600);
				}

				if (next <= 0 && !endFiredRef.current) {
					endFiredRef.current = true;
					playEndBeep();
					clearInterval(intervalRef.current!);
					intervalRef.current = null;
					
					// Transition to "Find Werewolf" phase
					setEndgameNarrating(true);
					speak("Hết giờ! Dân làng hãy thảo luận để tìm ra Ma sói.", () => {
						setEndgameNarrating(false);
					});
					setEndgameTimeLeft(state.settings.findWerewolfDuration);
					setStep("find-werewolf");
					return 0;
				}

				return next;
			});
		}, 1000);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [step, paused, currentGame]);

	// Endgame Timer Logic
	useEffect(() => {
		if ((step !== "find-seer" && step !== "find-werewolf") || endgameNarrating) {
			lastSpokenRef.current = -1;
			return;
		}

		endgameIntervalRef.current = setInterval(() => {
			setEndgameTimeLeft((prev) => {
				const next = Math.max(0, prev - 1);
				
				// Side effects should happen outside or be guarded
				if (next <= 5 && next > 0 && next !== lastSpokenRef.current) {
					lastSpokenRef.current = next;
					playWarningBeep();
					speak(next.toString());
				}
				
				if (next === 0 && lastSpokenRef.current !== 0) {
					lastSpokenRef.current = 0;
					playEndBeep();
					speak("Hết giờ!");
					// We don't call setStep here immediately to avoid double triggers in dev
				}
				return next;
			});
		}, 1000);

		return () => {
			if (endgameIntervalRef.current) clearInterval(endgameIntervalRef.current);
		};
	}, [step, endgameNarrating]);

	// Auto-navigate when endgame timer hits zero
	useEffect(() => {
		if ((step === "find-seer" || step === "find-werewolf") && endgameTimeLeft === 0 && !endgameNarrating && lastSpokenRef.current === 0) {
			const timeout = setTimeout(() => setStep("result"), 1000);
			return () => clearTimeout(timeout);
		}
	}, [endgameTimeLeft, step, endgameNarrating]);

	// TTS sync
	function toggleTTS() {
		const next = !ttsOn;
		setTtsOn(next);
		setTTSEnabled(next);
	}

	function handleWordGuessed() {
		if (step !== "timer") return;
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		
		setEndgameNarrating(true);
		speak("Đoán trúng từ! Ma sói hãy tìm ra Tiên tri.", () => {
			setEndgameNarrating(false);
		});
		setEndgameTimeLeft(state.settings.findSeerDuration);
		setStep("find-seer");
	}

	function handleSelectWord(word: any) {
		if (!currentGame) return;
		dispatch({
			type: "START_GAME",
			payload: {
				...currentGame,
				word: word,
			},
		});
	}

	function handleRevealWord() {
		setWordVisible(true);
	}

	function handleWordSeen() {
		setWordVisible(false);
		setStep("narration");
		setNarrationIndex(-1);
		setNarrationPhase("waking");
	}

	function handleRoleSeen() {
		setNarrationPhase("sleeping");
	}

	function handleSaveResult(r: "villagers" | "werewolf") {
		setResult(r);
		if (!currentGame) return;

		const entry: GameHistory = {
			id: crypto.randomUUID(),
			date: new Date().toISOString(),
			secretWord: currentGame.word.text,
			wordPackName: currentGame.packIds
				.map((id) => state.wordPacks.find((p) => p.id === id)?.name)
				.filter(Boolean)
				.join(", "),
			difficulty: currentGame.word.difficulty,
			result: r,
			duration: durationRef.current,
			timerDuration: currentGame.timerDuration,
		};

		dispatch({ type: "ADD_HISTORY", payload: entry });
	}

	function goHome() {
		dispatch({ type: "END_GAME" });
		router.push("/");
	}

	if (!currentGame) return null;

	const isWarning = timeLeft <= 30 && timeLeft > 0;
	const activeRoles = getActiveRoles(currentGame);
	const currentNarrationRole =
		narrationIndex >= 0 && narrationIndex < activeRoles.length
			? activeRoles[narrationIndex]
			: null;

	return (
		<div
			className={`min-h-screen flex flex-col transition-colors duration-500 ${flash ? "bg-red-900" : "bg-gray-950"}`}
		>
			{/* TTS toggle */}
			<div className="absolute top-4 right-4 z-10">
				<button
					onClick={toggleTTS}
					className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 transition-colors"
					aria-label={ttsOn ? "Tắt giọng đọc" : "Bật giọng đọc"}
				>
					{ttsOn ? (
						<svg
							className="w-5 h-5 text-purple-400"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
						</svg>
					) : (
						<svg
							className="w-5 h-5 text-gray-500"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
						</svg>
					)}
				</button>
			</div>


			{/* ── STEP 1: Night ── */}
			{step === "night" && (
				<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
					<div className="text-8xl animate-pulse">🌙</div>
					<div>
						<h2 className="text-3xl font-extrabold text-white mb-3">
							Đêm xuống
						</h2>
						<p className="text-gray-300 text-xl leading-relaxed">
							Tất cả mọi người
							<br />
							nhắm mắt lại.
						</p>
					</div>
				</div>
			)}

			{/* ── STEP 1.5: Thị trưởng Secret Role ── */}
			{step === "mayor-role" && (
				<MayorRolePhase selectionProgress={selectionProgress} />
			)}


			{/* ── STEP 2: Thị trưởng sees word ── */}
			{step === "mayor-word" && (
				<MayorWordPhase
					candidateWords={currentGame.candidateWords}
					selectedWord={currentGame.word}
					revealProgress={revealProgress}
					onSelectWord={handleSelectWord}
				/>
			)}

			{/* ── STEP 2.5: Thị trưởng Đi ngủ ── */}
			{step === "mayor-sleep" && (
				<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
					<div className="text-8xl animate-pulse">😴</div>
					<div>
						<h2 className="text-3xl font-extrabold text-white mb-3">
							Thị trưởng ngủ
						</h2>
						<p className="text-gray-300 text-xl leading-relaxed">
							Thị trưởng đang 
							<br />
							nhắm mắt lại...
						</p>
					</div>
					<div className="flex gap-1.5">
						<div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]"></div>
						<div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]"></div>
						<div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
					</div>
				</div>
			)}

			{/* ── STEP 3: Narration ── */}
			{step === "narration" && (
				<NarrationPhase
					currentRole={currentNarrationRole}
					narrationPhase={narrationPhase}
					narrationIndex={narrationIndex}
					selectionProgress={selectionProgress}
					activeRolesLength={activeRoles.length}
					wordText={
						currentNarrationRole?.id === "role-fortune-teller"
							? currentGame.word.text
									.split(" ")
									.map((w) => w[0].toUpperCase())
							: currentGame.word.text
					}
				/>
			)}

			{/* ── STEP 4: Dawn ── */}
			{step === "dawn" && (
				<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
					<div className="text-8xl">☀️</div>
					<div>
						<h2 className="text-3xl font-extrabold text-white mb-3">
							Bình minh ló dạng
						</h2>
						<p className="text-gray-300 text-xl leading-relaxed">
							Tất cả mọi người mở mắt.
							<br />
							Bắt đầu đặt câu hỏi!
						</p>
					</div>
					<p className="text-purple-400 text-sm animate-pulse">
						Đồng hồ sắp bắt đầu...
					</p>
				</div>
			)}

			{/* ── STEP 5: Timer ── */}
			{step === "timer" && (
				<TimerPhase
					timeLeft={timeLeft}
					isWarning={isWarning}
					paused={paused}
					onTogglePause={() => setPaused((p) => !p)}
					onWordGuessed={handleWordGuessed}
				/>
			)}

			{/* ── STEP 5.5: Endgame Branch ── */}
			{(step === "find-seer" || step === "find-werewolf") && (
				<EndgamePhase 
					type={step === "find-seer" ? "find-seer" : "find-werewolf"} 
					timeLeft={endgameTimeLeft} 
				/>
			)}

			{/* ── STEP 6: Result ── */}
			{step === "result" && (
				<ResultPhase
					result={result}
					onSaveResult={handleSaveResult}
					onGoHome={goHome}
				/>
			)}
		</div>
	);
}
