"use client";

import TimerDisplay from "@/components/TimerDisplay";

interface TimerPhaseProps {
	timeLeft: number;
	isWarning: boolean;
	paused: boolean;
	onTogglePause: () => void;
	onWordGuessed: () => void;
}

export default function TimerPhase({
	timeLeft,
	isWarning,
	paused,
	onTogglePause,
	onWordGuessed,
}: TimerPhaseProps) {
	return (
		<div
			className={`flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 transition-colors duration-300 ${
				isWarning ? "bg-red-950" : ""
			}`}
		>
			<TimerDisplay seconds={timeLeft} warning={isWarning} />

			{isWarning && (
				<p className="text-red-400 font-bold text-lg animate-pulse">
					⚠️ Còn 30 giây!
				</p>
			)}

			<div className="flex flex-col gap-4 w-full mt-4">
				<button
					onClick={onWordGuessed}
					className="w-full bg-green-700 hover:bg-green-600 text-white font-bold text-xl py-5 rounded-2xl shadow-lg shadow-green-900/30 transition-all active:scale-95"
				>
					✨ Đã đoán trúng từ!
				</button>
				
				<button
					onClick={onTogglePause}
					className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg py-4 rounded-2xl border border-gray-700 transition-colors"
				>
					{paused ? "▶ Tiếp tục" : "⏸ Dừng"}
				</button>
			</div>

			<div className="space-y-4">
				<h2 className="text-3xl font-black text-white uppercase tracking-widest">
					Đang thảo luận...
				</h2>
				<p className="text-gray-400 text-lg">
					"Dân làng" hãy đặt câu hỏi Có/Không cho Thị trưởng.
				</p>
			</div>
		</div>
	);
}
