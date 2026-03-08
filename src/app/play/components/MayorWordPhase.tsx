"use client";

import FourWayReveal from "./FourWayReveal";

// Assuming Word type is defined elsewhere or needs to be defined here
interface Word {
	id: string;
	text: string;
	difficulty: "easy" | "medium" | "hard";
}

interface MayorWordPhaseProps {
	candidateWords?: Word[];
	selectedWord: Word;
	revealProgress: number;
	onSelectWord: (word: Word) => void;
}

export default function MayorWordPhase({
	candidateWords,
	selectedWord,
	revealProgress,
	onSelectWord,
}: MayorWordPhaseProps) {
	// If no candidate words, just show the selected one (fallback)
	if (!candidateWords || candidateWords.length < 2) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
				<FourWayReveal
					text={selectedWord.text}
					progress={revealProgress}
					roleName="Thị trưởng"
				/>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col items-center justify-center px-4 text-center w-full mx-auto gap-8">
			<div className="space-y-2">
				<h2 className="text-2xl font-black text-white uppercase tracking-tight">
					Thị trưởng
				</h2>
				<p className="text-gray-400 font-medium italic">
					Hãy chọn 1 trong 2 từ bí mật sau:
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 w-full">
				{candidateWords.map((w) => (
					<button
						key={w.id}
						onClick={() => onSelectWord(w)}
						className={`relative p-8 rounded-3xl border-4 transition-all overflow-hidden group ${
							selectedWord.id === w.id
								? "bg-purple-900/40 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-105"
								: "bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50"
						}`}
					>
						<div className="relative z-10 flex flex-col items-center gap-2">
							<span
								className={`text-3xl font-black tracking-tight ${
									selectedWord.id === w.id
										? "text-white"
										: "text-gray-300"
								}`}
							>
								{w.text}
							</span>
							<span
								className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
									w.difficulty === "easy"
										? "bg-green-900/40 text-green-400 border border-green-800"
										: w.difficulty === "medium"
											? "bg-yellow-900/40 text-yellow-400 border border-yellow-800"
											: "bg-red-900/40 text-red-400 border border-red-800"
								}`}
							>
								{w.difficulty === "easy"
									? "Dễ"
									: w.difficulty === "medium"
										? "Vừa"
										: "Khó"}
							</span>
						</div>
						{selectedWord.id === w.id && (
							<div className="absolute top-3 right-3">
								<div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
									<svg
										className="w-4 h-4 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={4}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
							</div>
						)}
					</button>
				))}
			</div>

			<div className="w-full flex justify-center">
				<div className="relative w-16 h-16 flex items-center justify-center">
					<svg className="absolute inset-0 w-full h-full -rotate-90">
						<circle
							cx="50%"
							cy="50%"
							r="42%"
							fill="none"
							stroke="currentColor"
							strokeWidth="4"
							className="text-gray-800"
						/>
						<circle
							cx="50%"
							cy="50%"
							r="42%"
							fill="none"
							stroke="currentColor"
							strokeWidth="6"
							strokeDasharray="211.11"
							strokeDashoffset={211.11 * (1 - revealProgress / 100)}
							strokeLinecap="round"
							className="text-purple-500 transition-all duration-75"
						/>
					</svg>
					<span className="text-xs font-black text-white">
						{Math.ceil((revealProgress / 100) * (10))}s
					</span>
				</div>
			</div>
		</div>
	);
}
