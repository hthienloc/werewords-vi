"use client";

interface MayorRolePhaseProps {
	selectionProgress: number;
}

export default function MayorRolePhase({ selectionProgress }: MayorRolePhaseProps) {
	return (
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
				<div className="text-7xl z-10 drop-shadow-2xl">😶</div>
			</div>
			<div>
				<h2 className="text-2xl font-bold text-white mb-2">Thị trưởng</h2>
				<p className="text-gray-300 text-lg">
					Hãy xem vai trò bí mật của bạn.
				</p>
			</div>
		</div>
	);
}
