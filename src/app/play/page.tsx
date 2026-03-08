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
	| "narration"
	| "night-end"
	| "dawn"
	| "timer"
	| "result";

function FourWayReveal({
	text,
	progress,
	roleName,
}: {
	text: string;
	progress?: number;
	roleName?: string;
}) {
	return (
		<div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
			{/* Word at Top edge */}
			<div className="absolute top-10 left-1/2 -translate-x-1/2 rotate-180">
				<p className="text-4xl font-black text-white bg-gray-900/90 px-6 py-2 rounded-xl shadow-2xl border border-gray-800 whitespace-nowrap">
					{text}
				</p>
			</div>

			{/* Word at Bottom edge */}
			<div className="absolute bottom-20 left-1/2 -translate-x-1/2">
				<p className="text-4xl font-black text-white bg-gray-900/90 px-6 py-2 rounded-xl shadow-2xl border border-gray-800 whitespace-nowrap">
					{text}
				</p>
			</div>

			{/* Word at Left edge */}
			<div className="absolute left-2 top-1/2 -translate-y-1/2 rotate-90 origin-center">
				<p className="text-3xl font-black text-white bg-gray-900/95 px-5 py-2 rounded-xl shadow-2xl border border-gray-800 whitespace-nowrap">
					{text}
				</p>
			</div>

			{/* Word at Right edge */}
			<div className="absolute right-2 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
				<p className="text-3xl font-black text-white bg-gray-900/95 px-5 py-2 rounded-xl shadow-2xl border border-gray-800 whitespace-nowrap">
					{text}
				</p>
			</div>

			{/* Center indicator - always centered in viewport */}
			<div className="relative w-32 h-32 flex items-center justify-center bg-gray-950/80 rounded-full backdrop-blur-lg border border-purple-500/30 shadow-2xl">
				{progress !== undefined && (
					<svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
						<circle
							cx="50"
							cy="50"
							r="45"
							fill="none"
							stroke="currentColor"
							strokeWidth="4"
							className="text-gray-800"
						/>
						<circle
							cx="50"
							cy="50"
							r="45"
							fill="none"
							stroke="currentColor"
							strokeWidth="8"
							strokeDasharray="282.74"
							strokeDashoffset={282.74 * (1 - progress / 100)}
							strokeLinecap="round"
							className="text-purple-500 transition-all duration-75"
						/>
					</svg>
				)}
				<div className="z-10 text-center flex flex-col items-center">
					<span className="text-purple-400 text-[9px] font-bold uppercase tracking-widest opacity-80 mb-1">
						Vai trò
					</span>
					<span className="text-white font-black text-xl whitespace-nowrap drop-shadow-lg">
						{roleName}
					</span>
				</div>
			</div>
		</div>
	);
}

export default function PlayPage() {
	const { state, dispatch } = useApp();
	const router = useRouter();

	const [step, setStep] = useState<Step>("start-night");
	const [wordVisible, setWordVisible] = useState(false);
	const [timeLeft, setTimeLeft] = useState(0);
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

	// Interaction required to unlock audio API
	function handleStartNight() {
		initAudio();
		speak("Bắt đầu ván chơi.");
		setStep("night");
	}

	useEffect(() => {
		if (step === "night") {
			import("@/lib/audio").then((m) => m.playSleepChime());
			speak("Đêm xuống. Tất cả mọi người nhắm mắt lại.", () => {
				setTimeout(() => {
					setStep("mayor-role");
				}, 1000);
			});
		}
	}, [step]);

	// Step 1.5: Thị trưởng role - auto pick or delay
	useEffect(() => {
		if (step === "mayor-role") {
			speak("Thị trưởng mở mắt, hãy chọn vai trò bí mật của bạn.", () => {
				setSelectionProgress(100);
				const start = Date.now();
				const duration = 10000;
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
	}, [step]);


	useEffect(() => {
		if (step === "mayor-word") {
			speak("Thị trưởng hãy mở mắt và xem từ bí mật.", () => {
				setWordVisible(true);
				setRevealProgress(100);
				const start = Date.now();
				const duration = 8000;
				const interval = setInterval(() => {
					const elapsed = Date.now() - start;
					const remaining = Math.max(
						0,
						100 - (elapsed / duration) * 100
					);
					setRevealProgress(remaining);
					if (elapsed >= duration) {
						clearInterval(interval);
						setWordVisible(false);
						setStep("narration");
						setNarrationIndex(-1);
						setNarrationPhase("waking");
					}
				}, 50);
				return () => clearInterval(interval);
			});
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
				// Start countdown for the role's action time (8s)
				setSelectionProgress(100);
				const startSnapshot = Date.now();
				const duration = 8000;
				const interval = setInterval(() => {
					const elapsed = Date.now() - startSnapshot;
					const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
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
			speak("Mọi người mở mắt. Bình minh.", () => {
				setTimeout(() => {
					setStep("timer");
					setTimeLeft(currentGame?.timerDuration ?? 180);
				}, 1500);
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
					setTimeout(() => setStep("result"), 1200);
					return 0;
				}

				return next;
			});
		}, 1000);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [step, paused, currentGame]);

	// TTS sync
	function toggleTTS() {
		const next = !ttsOn;
		setTtsOn(next);
		setTTSEnabled(next);
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
		dispatch({ type: "END_GAME" });
	}

	function goHome() {
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

			{/* ── STEP 0: Manual Start to unlock audio ── */}
			{step === "start-night" && (
				<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
					<div className="text-8xl animate-bounce">🌙</div>
					<div>
						<h2 className="text-3xl font-extrabold text-white mb-3">
							Sẵn sàng?
						</h2>
						<p className="text-gray-400 text-lg">
							Nhấn nút bên dưới để bắt đầu ván chơi.
						</p>
					</div>
					<button
						onClick={handleStartNight}
						className="bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-lg shadow-purple-900/40 transition-all transform active:scale-95"
					>
						🔥 Bắt đầu Ngay
					</button>
				</div>
			)}

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
				<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
					<div className="relative w-36 h-36 flex items-center justify-center">
						<svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
							<circle
								cx="50"
								cy="50"
								r="45"
								fill="none"
								stroke="currentColor"
								strokeWidth="4"
								className="text-gray-800"
							/>
							<circle
								cx="50"
								cy="50"
								r="45"
								fill="none"
								stroke="currentColor"
								strokeWidth="6"
								strokeDasharray="282.74"
								strokeDashoffset={282.74 * (1 - selectionProgress / 100)}
								strokeLinecap="round"
								className="text-purple-500 transition-all duration-75"
							/>
						</svg>
						<div className="text-7xl z-10 drop-shadow-2xl">🎭</div>
					</div>
					<div>
						<h2 className="text-2xl font-bold text-white mb-2">
							Thị trưởng
						</h2>
						<p className="text-gray-300 text-lg">
							Hãy chọn vai trò bí mật của bạn (lá bài ở giữa).
						</p>
					</div>
								"role-fortune-teller",
								"role-apprentice",
								"role-minion",
							].includes(r.id)
						).map((role) => (
							<div
								key={role.id}
								className="bg-gray-800 border border-gray-700 rounded-xl py-4 px-3 flex flex-col items-center gap-1"
							>
								<span className="text-2xl">{role.emoji}</span>
								<span className="text-sm font-bold text-white">
									{role.name}
								</span>
							</div>
						))}
					</div>
				</div>
			)}


			{/* ── STEP 2: Thị trưởng sees word ── */}
			{step === "mayor-word" && (
				<div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
					{!wordVisible && (
						<div className="flex flex-col items-center gap-6">
							<div>
								<h2 className="text-2xl font-bold text-white mb-2">
									Thị trưởng
								</h2>
								<p className="text-gray-300 text-lg">
									Hãy mở mắt và xem từ bí mật.
								</p>
							</div>
						</div>
					)}

					{wordVisible && (
						<FourWayReveal
							text={currentGame.word.text}
							progress={revealProgress}
							roleName="Thị trưởng"
						/>
					)}
				</div>
			)}

			{/* ── STEP 3: Narration ── */}
			{step === "narration" && (
				<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
					{(!currentNarrationRole || !WORD_ROLES.has(currentNarrationRole.id) || narrationPhase === "sleeping") && (
						<div className="text-7xl animate-pulse">🌙</div>
					)}

					{/* Thị trưởng sleeping */}
					{narrationIndex === -1 && (
						<div>
							<h2 className="text-3xl font-extrabold text-white mb-3">
								Giai đoạn ban đêm
							</h2>
							<p className="text-gray-300 text-xl">
								Thị trưởng đang đi ngủ...
							</p>
						</div>
					)}

					{/* Role is awake — show info + confirm button */}
					{currentNarrationRole && narrationPhase === "waking" && (
						<div className="w-full max-w-sm flex flex-col items-center gap-5">
							{!WORD_ROLES.has(currentNarrationRole.id) && (
								<div className="flex flex-col items-center gap-6">
									<div className="relative w-36 h-36 flex items-center justify-center">
										<svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
											<circle
												cx="50"
												cy="50"
												r="45"
												fill="none"
												stroke="currentColor"
												strokeWidth="4"
												className="text-gray-800"
											/>
											<circle
												cx="50"
												cy="50"
												r="45"
												fill="none"
												stroke="currentColor"
												strokeWidth="6"
												strokeDasharray="282.74"
												strokeDashoffset={282.74 * (1 - selectionProgress / 100)}
												strokeLinecap="round"
												className="text-purple-500 transition-all duration-75"
											/>
										</svg>
										<span className="text-7xl z-10 drop-shadow-2xl">
											{currentNarrationRole.emoji}
										</span>
									</div>
									<div className="text-center">
										<p className="text-purple-400 text-3xl font-black uppercase tracking-widest">
											{currentNarrationRole.name}
										</p>
										<p className="text-gray-500 text-lg mt-2 italic font-medium">
											Người khác, ĐỪNG mở mắt!
										</p>
									</div>
								</div>
							)}

							{/* Word/letters for roles that need them */}
							{WORD_ROLES.has(currentNarrationRole.id) && (
								<FourWayReveal
									text={
										currentNarrationRole.id ===
										"role-fortune-teller"
											? currentGame.word.text
													.split(" ")
													.map((w) =>
														w[0].toUpperCase()
													)
													.join(" · ")
											: currentGame.word.text
									}
									progress={selectionProgress}
									roleName={currentNarrationRole.name}
								/>
							)}

							{/* Action-only roles */}
							{!WORD_ROLES.has(currentNarrationRole.id) && (
								<p className="text-gray-300 text-lg">
									Đang chờ hành động...
								</p>
							)}
						</div>
					)}

					{/* Role sleeping */}
					{currentNarrationRole && narrationPhase === "sleeping" && (
						<div>
							<span className="text-5xl block mb-3">
								{currentNarrationRole.emoji}
							</span>
							<p className="text-gray-300 text-xl">
								{currentNarrationRole.name} đang đi ngủ...
							</p>
						</div>
					)}

					{narrationIndex >= activeRoles.length &&
						narrationIndex >= 0 && (
							<p className="text-gray-300 text-xl">
								Đang chuẩn bị bình minh...
							</p>
						)}
				</div>
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
				<div
					className={`flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 transition-colors duration-300 ${isWarning ? "bg-red-950" : ""}`}
				>
					<TimerDisplay seconds={timeLeft} warning={isWarning} />

					{isWarning && (
						<p className="text-red-400 font-bold text-lg animate-pulse">
							⚠️ Còn 30 giây!
						</p>
					)}

					<div className="flex gap-4 mt-4">
						<button
							onClick={() => setPaused((p) => !p)}
							className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg px-8 py-4 rounded-2xl border border-gray-700 transition-colors"
						>
							{paused ? "▶ Tiếp tục" : "⏸ Dừng"}
						</button>
					</div>

					<div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-400">
						Từ bí mật đã được Thị trưởng xem
					</div>
				</div>
			)}

			{/* ── STEP 6: Time's up / Result ── */}
			{step === "result" && result === null && (
				<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
					<div className="text-7xl">⏰</div>
					<h2 className="text-3xl font-extrabold text-white">
						Hết giờ!
					</h2>
					<p className="text-gray-300 text-lg">Ai thắng ván này?</p>

					<div className="w-full max-w-sm flex flex-col gap-4 mt-4">
						<button
							onClick={() => handleSaveResult("villagers")}
							className="w-full bg-green-700 hover:bg-green-600 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
						>
							🎉 Dân làng đoán đúng
						</button>
						<button
							onClick={() => handleSaveResult("werewolf")}
							className="w-full bg-red-700 hover:bg-red-600 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
						>
							🐺 Ma sói thắng
						</button>
					</div>

					<div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-400">
						Từ bí mật:{" "}
						<span className="text-white font-bold">
							{currentGame.word.text}
						</span>
					</div>
				</div>
			)}

			{/* Result saved confirmation */}
			{step === "result" && result !== null && (
				<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
					<div className="text-7xl">
						{result === "villagers" ? "🎉" : "🐺"}
					</div>
					<h2 className="text-3xl font-extrabold text-white">
						{result === "villagers"
							? "Dân làng thắng!"
							: "Ma sói thắng!"}
					</h2>
					<p className="text-gray-400">
						Từ bí mật:{" "}
						<span className="text-white font-bold">
							{currentGame.word.text}
						</span>
					</p>
					<p className="text-gray-500 text-sm">Kết quả đã được lưu</p>

					<button
						onClick={goHome}
						className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xl px-12 py-5 rounded-2xl mt-4 transition-colors"
					>
						🏠 Về trang chủ
					</button>
				</div>
			)}
		</div>
	);
}
