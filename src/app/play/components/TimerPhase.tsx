"use client";



interface TimerPhaseProps {
	timeLeft: number;
	isWarning: boolean;
	onWordGuessed: () => void;
}

export default function TimerPhase({
	timeLeft,
	isWarning,
	onWordGuessed,
}: TimerPhaseProps) {
	return (
		<div
			className={`flex flex-row items-center justify-between w-full px-4 py-2 gap-4 rounded-2xl transition-all duration-300 border border-white/5 ${
				isWarning ? "bg-red-950/40 border-red-500/30" : "bg-gray-900/40"
			}`}
		>
			<div className={`text-4xl font-black tabular-nums tracking-tighter ${isWarning ? 'text-red-400 animate-pulse' : 'text-indigo-400'}`}>
				{Math.floor(timeLeft / 60)}:{ (timeLeft % 60).toString().padStart(2, '0') }
			</div>

			<button
				onClick={onWordGuessed}
				className="bg-green-600 hover:bg-green-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wider"
			>
				✨ Đoán trúng
			</button>
		</div>
	);
}
