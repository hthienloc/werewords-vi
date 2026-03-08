"use client";

import { GameRole } from "@/types";
import FourWayReveal from "./FourWayReveal";

// Roles that need to see the secret word during narration
const WORD_ROLES = new Set([
	"role-seer",
	"role-fortune-teller",
	"role-apprentice",
	"role-werewolf",
]);

interface NarrationPhaseProps {
	currentRole: GameRole | null;
	narrationPhase: "waking" | "sleeping";
	narrationIndex: number;
	selectionProgress: number;
	wordText: string | string[]; // Can be full word or letters (for fortune teller)
	activeRolesLength: number;
}

export default function NarrationPhase({
	currentRole,
	narrationPhase,
	narrationIndex,
	selectionProgress,
	wordText,
	activeRolesLength,
}: NarrationPhaseProps) {
	return (
		<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
			{(!currentRole ||
				!WORD_ROLES.has(currentRole.id) ||
				narrationPhase === "sleeping") && (
				<div className="text-7xl animate-pulse">🌙</div>
			)}

			{/* Mayor sleeping / Initial state */}
			{narrationIndex === -1 && (
				<div>
					<h2 className="text-3xl font-extrabold text-white mb-3">
						Giai đoạn ban đêm
					</h2>
					<p className="text-gray-300 text-xl">Thị trưởng đang đi ngủ...</p>
				</div>
			)}

			{/* Role is awake */}
			{currentRole && narrationPhase === "waking" && (
				<div className="w-full flex flex-col items-center gap-5">
					{!WORD_ROLES.has(currentRole.id) && (
						<div className="flex flex-col items-center gap-6">
							<div className="relative w-36 h-36 flex items-center justify-center">
								<svg
									className="absolute inset-0 w-full h-full -rotate-90"
									viewBox="0 0 100 100"
								>
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
									{currentRole.emoji}
								</span>
							</div>
							<div className="text-center">
								<p className="text-purple-400 text-3xl font-black uppercase tracking-widest">
									{currentRole.name}
								</p>
								<p className="text-gray-500 text-lg mt-2 italic font-medium">
									Người khác, ĐỪNG mở mắt!
								</p>
							</div>
						</div>
					)}

					{/* Word/letters for roles that need them */}
					{WORD_ROLES.has(currentRole.id) && (
						<FourWayReveal
							text={Array.isArray(wordText) ? wordText.join(" · ") : wordText}
							progress={selectionProgress}
							roleName={currentRole.name}
						/>
					)}

					{/* Action-only roles status */}
					{!WORD_ROLES.has(currentRole.id) && (
						<p className="text-gray-300 text-lg">Đang chờ hành động...</p>
					)}
				</div>
			)}

			{/* Role sleeping */}
			{currentRole && narrationPhase === "sleeping" && (
				<div>
					<span className="text-5xl block mb-3">{currentRole.emoji}</span>
					<p className="text-gray-300 text-xl">
						{currentRole.name} đang đi ngủ...
					</p>
				</div>
			)}

			{/* Between roles / Transition */}
			{narrationIndex >= activeRolesLength && narrationIndex >= 0 && (
				<p className="text-gray-300 text-xl">Đang chuẩn bị bình minh...</p>
			)}
		</div>
	);
}
