"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { ALL_ROLES } from "@/lib/roles";
import { GameRole } from "@/types";
import { speak } from "@/lib/tts";
import { initAudio } from "@/lib/audio";

const TIMER_OPTIONS = [
	{ label: "3 phút", value: 180 },
	{ label: "4 phút", value: 240 },
	{ label: "5 phút", value: 300 },
];

export default function SetupPage() {
	const { state, dispatch } = useApp();
	const router = useRouter();

	// Two-step flow: 'roles' → 'settings'
	const [step, setStep] = useState<"roles" | "settings">("roles");

	const [selectedPackIds, setSelectedPackIds] = useState<string[]>(
		state.settings.selectedPackIds || []
	);
	const [difficulty, setDifficulty] = useState<
		"all" | "easy" | "medium" | "hard"
	>(state.settings.filterDifficulty);
	const [timer, setTimer] = useState(state.settings.timerDuration);
	const [customTimer, setCustomTimer] = useState("");
	const [isTestSpeaking, setIsTestSpeaking] = useState(false);
	const [useCustom, setUseCustom] = useState(
		!TIMER_OPTIONS.find((o) => o.value === state.settings.timerDuration)
	);
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
		state.settings.selectedRoleIds || []
	);
	const [playerCount, setPlayerCount] = useState(6);
	const [roleComplexity, setRoleComplexity] = useState<
		"easy" | "medium" | "hard"
	>("easy");
	const [error, setError] = useState("");
	const [activeRoleDetail, setActiveRoleDetail] = useState<GameRole | null>(
		null
	);
	const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (state.hydrated) {
			setSelectedPackIds(state.settings.selectedPackIds || []);
			setDifficulty(state.settings.filterDifficulty);
			setTimer(state.settings.timerDuration);
			setSelectedRoleIds(state.settings.selectedRoleIds || []);
			setRoleComplexity(
				(state.settings.selectedRoleIds || []).some(
					(id) =>
						ALL_ROLES.find((r) => r.id === id)?.complexity ===
						"hard"
				)
					? "hard"
					: (state.settings.selectedRoleIds || []).some(
								(id) =>
									ALL_ROLES.find((r) => r.id === id)
										?.complexity === "medium"
						  )
						? "medium"
						: "easy"
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.hydrated]);

	const selectedPacks = state.wordPacks.filter((p) =>
		selectedPackIds.includes(p.id)
	);

	const availableWords = state.wordPacks
		.filter((p) => selectedPackIds.includes(p.id))
		.flatMap((p) =>
			p.words.filter(
				(w) =>
					!w.used &&
					(difficulty === "all" || w.difficulty === difficulty)
			)
		);

	function handleStart() {
		if (selectedPacks.length === 0) {
			setError("Vui lòng chọn ít nhất một bộ từ.");
			return;
		}
		if (availableWords.length === 0) {
			setError("Không có từ nào phù hợp với bộ lọc này.");
			return;
		}

		const timerVal = useCustom ? parseInt(customTimer) * 60 : timer;
		if (useCustom && (!customTimer || parseInt(customTimer) < 1)) {
			setError("Vui lòng nhập thời gian hợp lệ.");
			return;
		}

		if (selectedRoleIds.length === 0) {
			setError("Vui lòng chọn ít nhất một nhân vật (vai trò).");
			return;
		}

		const shuffled = [...availableWords].sort(() => 0.5 - Math.random());
		const candidateWords = shuffled.slice(0, 2);
		const initialWord = candidateWords[0];

		dispatch({
			type: "UPDATE_SETTINGS",
			payload: {
				selectedPackIds,
				filterDifficulty: difficulty,
				timerDuration: timerVal,
				selectedRoleIds,
			},
		});

		initAudio();

		dispatch({
			type: "START_GAME",
			payload: {
				packIds: selectedPackIds,
				word: initialWord,
				candidateWords: candidateWords,
				startTime: Date.now(),
				timerDuration: timerVal,
				roleIds: selectedRoleIds,
			},
		});

		router.push("/play");
	}

	return (
		<div className="min-h-screen flex flex-col">
			{/* Navbar: back to home on step 1, back to roles on step 2 */}
			<Navbar
				title={step === "roles" ? "Chọn nhân vật" : "Cài đặt ván chơi"}
				backHref={step === "roles" ? "/" : undefined}
				onBack={
					step === "settings"
						? () => {
								setError("");
								setStep("roles");
							}
						: undefined
				}
			/>

			{/* Step indicator */}
			<div className="flex items-center gap-2 px-5 pt-4 max-w-lg mx-auto w-full">
				<div className="flex items-center gap-2 flex-1">
					<div
						className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === "roles" ? "bg-purple-600 text-white" : "bg-purple-900 text-purple-400"}`}
					>
						1
					</div>
					<span
						className={`text-xs font-semibold transition-colors ${step === "roles" ? "text-white" : "text-gray-500"}`}
					>
						Nhân vật
					</span>
				</div>
				<div className="flex-1 h-px bg-gray-800 relative">
					<div
						className={`absolute inset-0 bg-purple-600 transition-all duration-300 ${step === "settings" ? "opacity-100" : "opacity-0"}`}
					/>
				</div>
				<div className="flex items-center gap-2 flex-1 justify-end">
					<span
						className={`text-xs font-semibold transition-colors ${step === "settings" ? "text-white" : "text-gray-600"}`}
					>
						Cài đặt
					</span>
					<div
						className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === "settings" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-600"}`}
					>
						2
					</div>
				</div>
			</div>

			{/* ── STEP 1: Role Selection ── */}
			{step === "roles" && (
				<div className="flex-1 px-5 py-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
					{/* Quick preset buttons */}
					<div className="flex justify-between items-center">
						<p className="text-sm text-gray-400">
							Chọn nhanh theo mức độ:
						</p>
						<div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1 gap-1">
							{(["easy", "medium", "hard"] as const).map((c) => (
								<button
									key={c}
									onClick={() => {
										setRoleComplexity(c);
										const recommended = ALL_ROLES.filter(
											(r) =>
												c === "easy"
													? r.complexity === "easy"
													: c === "medium"
														? r.complexity ===
																"easy" ||
															r.complexity ===
																"medium"
														: true
										).map((r) => r.id);
										setSelectedRoleIds(recommended);
									}}
									className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${
										roleComplexity === c
											? "bg-purple-700 text-white"
											: "text-gray-500 hover:text-gray-300"
									}`}
								>
									{c === "easy"
										? "Dễ"
										: c === "medium"
											? "Vừa"
											: "Khó"}
								</button>
							))}
						</div>
					</div>

					{/* Role grid */}
					<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
						{ALL_ROLES.map((role) => {
							const isSelected = selectedRoleIds.includes(
								role.id
							);
							return (
								<button
									key={role.id}
									onClick={() => {
										if (isSelected) {
											setSelectedRoleIds(
												selectedRoleIds.filter(
													(id) => id !== role.id
												)
											);
										} else {
											setSelectedRoleIds([
												...selectedRoleIds,
												role.id,
											]);
										}
									}}
									onPointerDown={() => {
										holdTimerRef.current = setTimeout(
											() => setActiveRoleDetail(role),
											500
										);
									}}
									onPointerUp={() => {
										if (holdTimerRef.current)
											clearTimeout(holdTimerRef.current);
									}}
									onPointerLeave={() => {
										if (holdTimerRef.current)
											clearTimeout(holdTimerRef.current);
									}}
									className={`relative flex flex-col items-center justify-center pt-5 pb-3 px-1 rounded-xl transition-all border group overflow-hidden ${
										isSelected
											? "bg-purple-900/40 border-purple-500"
											: "bg-gray-800 border-gray-700 grayscale opacity-60"
									}`}
								>
									<div
										className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isSelected ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "bg-gray-600"}`}
									/>
									<span className="text-4xl mb-2 transition-transform group-hover:scale-110 duration-300">
										{role.emoji}
									</span>
									<span
										className={`text-[10px] font-extrabold uppercase tracking-wider text-center px-1 ${isSelected ? "text-white" : "text-gray-500"}`}
									>
										{role.name}
									</span>
								</button>
							);
						})}
					</div>

					<p className="text-[10px] text-gray-500 italic">
						Nhấn để chọn/bỏ. Giữ để xem chi tiết nhân vật.
					</p>

					{/* Role detail popup */}
					{activeRoleDetail && (
						<div
							className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
							onClick={() => setActiveRoleDetail(null)}
						>
							<div
								className="bg-gray-900 border border-purple-700 rounded-2xl p-6 max-w-sm w-full flex flex-col items-center gap-3"
								onClick={(e) => e.stopPropagation()}
							>
								<span className="text-6xl">
									{activeRoleDetail.emoji}
								</span>
								<h3 className="text-xl font-extrabold text-white">
									{activeRoleDetail.name}
								</h3>
								<p className="text-gray-300 text-sm text-center leading-relaxed">
									{activeRoleDetail.description}
								</p>
								{activeRoleDetail.nightDescription && (
									<p className="text-purple-400 text-xs text-center italic border-t border-gray-800 pt-3 w-full">
										🌙 {activeRoleDetail.nightDescription}
									</p>
								)}
								<button
									onClick={() => setActiveRoleDetail(null)}
									className="mt-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold px-6 py-2 rounded-xl border border-gray-700"
								>
									Đóng
								</button>
							</div>
						</div>
					)}

					{/* Selected count + Continue */}
					<div className="mt-auto flex flex-col gap-3">
						<p className="text-center text-sm text-gray-500">
							Đã chọn{" "}
							<span className="text-purple-400 font-bold">
								{selectedRoleIds.length}
							</span>{" "}
							nhân vật
						</p>
						<button
							onClick={() => {
								if (selectedRoleIds.length === 0) {
									setError(
										"Vui lòng chọn ít nhất một nhân vật."
									);
									return;
								}
								setError("");
								setStep("settings");
							}}
							className="w-full bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white text-lg font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-purple-900/40"
						>
							Tiếp theo →
						</button>
						{error && (
							<div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
								{error}
							</div>
						)}
					</div>
				</div>
			)}

			{/* ── STEP 2: Game Settings ── */}
			{step === "settings" && (
				<div className="flex-1 px-5 py-4 flex flex-col gap-6 max-w-lg mx-auto w-full">
					<div>
						<label className="block text-sm font-semibold text-gray-300 mb-3">
							Bộ từ
						</label>
						<div className="grid grid-cols-2 gap-2">
							{state.wordPacks.map((pack) => {
								const isSelected = selectedPackIds.includes(
									pack.id
								);
								return (
									<button
										key={pack.id}
										onClick={() => {
											if (isSelected) {
												setSelectedPackIds(
													selectedPackIds.filter(
														(id) => id !== pack.id
													)
												);
											} else {
												setSelectedPackIds([
													...selectedPackIds,
													pack.id,
												]);
											}
											setError("");
										}}
										className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${
											isSelected
												? "bg-purple-900/40 border-purple-500 text-white"
												: "bg-gray-800 border-gray-700 text-gray-400 opacity-60"
										}`}
									>
										<span className="text-xl">
											{pack.emoji}
										</span>
										<div className="flex flex-col items-start overflow-hidden">
											<span className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full">
												{pack.name}
											</span>
											<span className="text-[10px] opacity-70">
												{pack.words.length} từ
											</span>
										</div>
										{isSelected && (
											<div className="ml-auto w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
												<svg
													className="w-3 h-3 text-white"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={3}
														d="M5 13l4 4L19 7"
													/>
												</svg>
											</div>
										)}
									</button>
								);
							})}
						</div>
					</div>

					{/* Player count & Word difficulty */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-semibold text-gray-300 mb-2">
								Số người chơi
							</label>
							<div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl px-2 py-1">
								<button
									onClick={() =>
										setPlayerCount(
											Math.max(3, playerCount - 1)
										)
									}
									className="p-2 text-gray-400 hover:text-white"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M20 12H4"
										/>
									</svg>
								</button>
								<span className="flex-1 text-center font-bold text-lg text-white">
									{playerCount}
								</span>
								<button
									onClick={() =>
										setPlayerCount(
											Math.min(20, playerCount + 1)
										)
									}
									className="p-2 text-gray-400 hover:text-white"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 4v16m8-8H4"
										/>
									</svg>
								</button>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-300 mb-2">
								Độ khó từ
							</label>
							<select
								value={difficulty}
								onChange={(e) =>
									setDifficulty(e.target.value as any)
								}
								className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base appearance-none focus:outline-none focus:border-purple-500"
							>
								<option value="all">🎯 Tất cả</option>
								<option value="easy">🟢 Dễ</option>
								<option value="medium">🟡 Trung bình</option>
								<option value="hard">🔴 Khó</option>
							</select>
						</div>
					</div>

					{/* Timer */}
					<div>
						<label className="block text-sm font-semibold text-gray-300 mb-2">
							Thời gian
						</label>
						<div className="flex gap-2 mb-2">
							{TIMER_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									onClick={() => {
										setTimer(opt.value);
										setUseCustom(false);
										setError("");
									}}
									className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors border ${
										!useCustom && timer === opt.value
											? "bg-purple-700 border-purple-500 text-white"
											: "bg-gray-800 border-gray-700 text-gray-300"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={() => {
									setUseCustom(true);
									setError("");
								}}
								className={`px-4 py-3 rounded-xl font-semibold text-sm transition-colors border ${
									useCustom
										? "bg-purple-700 border-purple-500 text-white"
										: "bg-gray-800 border-gray-700 text-gray-300"
								}`}
							>
								Tùy chỉnh
							</button>
							{useCustom && (
								<input
									type="number"
									min="1"
									max="60"
									placeholder="Phút"
									value={customTimer}
									onChange={(e) =>
										setCustomTimer(e.target.value)
									}
									className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-purple-500"
								/>
							)}
						</div>
					</div>

					{error && (
						<div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
							{error}
						</div>
					)}

					<div className="flex gap-3 mt-auto">
						<button
							onClick={() => {
								initAudio();
								setIsTestSpeaking(true);
								speak(
									"Kiểm tra âm thanh. Bạn có nghe rõ không?"
								);
								setTimeout(
									() => setIsTestSpeaking(false),
									3000
								);
							}}
							disabled={isTestSpeaking}
							className={`flex-1 font-semibold py-5 rounded-2xl border transition-all ${
								isTestSpeaking
									? "bg-purple-900/40 border-purple-500 text-purple-300 animate-pulse"
									: "bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-gray-300 border-gray-700"
							}`}
						>
							{isTestSpeaking
								? "🔊 Đang phát..."
								: "🔊 Thử tiếng"}
						</button>
						<button
							onClick={handleStart}
							disabled={availableWords.length === 0}
							className="flex-[2] bg-purple-700 hover:bg-purple-600 active:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xl font-bold py-5 rounded-2xl transition-colors shadow-lg shadow-purple-900/40"
						>
							🎮 Bắt đầu
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
