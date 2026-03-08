"use client";

import TimerDisplay from "@/components/TimerDisplay";

interface EndgamePhaseProps {
	type: "find-seer" | "find-werewolf";
	timeLeft: number;
}

export default function EndgamePhase({ type, timeLeft }: EndgamePhaseProps) {
	const isWarning = timeLeft <= 5 && timeLeft > 0;
	
	const title = type === "find-seer" 
		? "Ma sói tìm Tiên tri" 
		: "Dân làng tìm Ma sói";
		
	const instruction = type === "find-seer"
		? "Đoán trúng từ! Ma sói có cơ hội cuối cùng để tìm ra Tiên tri."
		: "Hết giờ! Dân làng có cơ hội cuối cùng để tìm ra Ma sói.";

	return (
		<div className={`flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 transition-colors duration-300 ${isWarning ? "bg-red-950" : ""}`}>
			<div className="space-y-2">
				<h2 className="text-3xl font-black text-white uppercase tracking-widest italic opacity-50">
					Hạ màn
				</h2>
				<h3 className="text-4xl font-black text-purple-400 uppercase tracking-tighter">
					{title}
				</h3>
			</div>

			<TimerDisplay seconds={timeLeft} warning={isWarning} />

			<div className="max-w-xs">
				<p className="text-gray-300 text-lg leading-relaxed font-medium">
					{instruction}
				</p>
			</div>

			{isWarning && (
				<p className="text-red-500 font-black text-xl animate-bounce uppercase tracking-widest">
					Sắp hết thời gian!
				</p>
			)}
		</div>
	);
}
