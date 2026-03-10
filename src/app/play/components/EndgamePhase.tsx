"use client";

import { Player } from "@/types";
import { TOKEN_DETAILS, TokenType } from "@/lib/groupGame";
import TimerDisplay from "@/components/TimerDisplay";

interface EndgamePhaseProps {
	type: "find-seer" | "find-werewolf";
	timeLeft: number;
	players: Player[];
	playerTokens: Record<string, TokenType[]>;
}

export default function EndgamePhase({ type, timeLeft, players, playerTokens }: EndgamePhaseProps) {
	const isWarning = timeLeft <= 5 && timeLeft > 0;
	
	const title = type === "find-seer" 
		? "Ma sói tìm Tiên tri" 
		: "Dân làng tìm Ma sói";
		
	const instruction = type === "find-seer"
		? "Đoán trúng từ! Ma sói hãy tìm ra Tiên tri."
		: "Hết giờ! Dân làng hãy thảo luận tìm Ma sói.";

	return (
		<div className={`flex-1 flex flex-col items-center justify-start py-4 px-3 text-center gap-4 transition-colors duration-300 overflow-hidden ${isWarning ? "bg-red-950/20" : ""}`}>
			
			{/* Compact Vertical Header */}
			<div className="shrink-0 w-full flex flex-col items-center gap-1">
				<div className="flex flex-row items-center justify-center gap-3 w-full">
					<div className="flex flex-col items-start">
						<h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic leading-none">
							Hạ màn
						</h2>
						<h3 className="text-xl font-black text-purple-400 uppercase tracking-tighter leading-tight mt-0.5">
							{title}
						</h3>
					</div>
					<div className="scale-50 origin-center -my-4">
						<TimerDisplay seconds={timeLeft} warning={isWarning} />
					</div>
				</div>
				<p className="text-gray-500 text-[10px] font-medium max-w-[200px]">
					{instruction}
				</p>
			</div>

			{/* Player Tokens Grid */}
			<div className="flex-1 w-full overflow-hidden flex flex-col mt-2">
				<div className="flex-1 overflow-y-auto no-scrollbar py-1">
					<div className="grid grid-cols-2 gap-2">
						{players.map(player => (
							<div key={player.id} className="flex flex-col bg-white/5 rounded-xl p-2.5 border border-white/5 text-left gap-1.5 h-full">
								<div className="flex items-center gap-1.5 overflow-hidden">
									<span className={`font-black text-xs truncate ${player.role === 'mayor' ? 'text-amber-400' : 'text-gray-200'}`}>
										{player.name}
									</span>
									{player.role === 'mayor' && (
										<span className="shrink-0 text-[7px] bg-amber-900/40 text-amber-500 px-1 rounded uppercase font-black tracking-tighter border border-amber-900/50">
											Thị trưởng
										</span>
									)}
								</div>
								
								<div className="flex flex-wrap gap-0.5 min-h-[22px] items-center">
									{playerTokens[player.id]?.length > 0 ? (
										playerTokens[player.id].map((t, idx) => (
											<span key={idx} className="text-base" title={TOKEN_DETAILS[t].label}>
												{TOKEN_DETAILS[t].emoji}
											</span>
										))
									) : (
										<span className="text-[9px] text-gray-700 italic font-medium uppercase tracking-tighter">no tokens</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{isWarning && (
				<p className="shrink-0 text-red-500 font-black text-xs animate-bounce uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
					Sắp hết giờ!
				</p>
			)}
		</div>
	);
}
