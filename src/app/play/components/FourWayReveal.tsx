"use client";

interface FourWayRevealProps {
	text: string;
	progress?: number;
	roleName?: string;
}

export default function FourWayReveal({
	text,
	progress,
	roleName,
}: FourWayRevealProps) {
	const fontSizeClass = text.length > 10 ? "text-3xl" : "text-4xl lg:text-5xl";

	return (
		<div className="fixed inset-0 pointer-events-none z-50 grid grid-cols-[1fr_auto_1fr] grid-rows-[1fr_auto_1fr] p-4 lg:p-8">
			{/* Top - Row 1, Col 2 */}
			<div className="col-start-2 row-start-1 flex items-start justify-center pt-8">
				<div className="rotate-180">
					<p className={`${fontSizeClass} font-black text-white bg-gray-900/90 px-8 py-3 rounded-2xl shadow-2xl border border-gray-800 whitespace-nowrap transition-all`}>
						{text}
					</p>
				</div>
			</div>

			{/* Left - Row 2, Col 1 */}
			<div className="col-start-1 row-start-2 flex items-center justify-center overflow-visible">
				<div className="rotate-90">
					<p className={`${fontSizeClass} font-black text-white bg-gray-900/95 px-8 py-3 rounded-2xl shadow-2xl border border-gray-800 whitespace-nowrap transition-all`}>
						{text}
					</p>
				</div>
			</div>

			{/* Center - Row 2, Col 2 */}
			<div className="col-start-2 row-start-2 flex items-center justify-center">
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

			{/* Right - Row 2, Col 3 */}
			<div className="col-start-3 row-start-2 flex items-center justify-center overflow-visible">
				<div className="-rotate-90">
					<p className={`${fontSizeClass} font-black text-white bg-gray-900/95 px-8 py-3 rounded-2xl shadow-2xl border border-gray-800 whitespace-nowrap transition-all`}>
						{text}
					</p>
				</div>
			</div>

			{/* Bottom - Row 3, Col 2 */}
			<div className="col-start-2 row-start-3 flex items-end justify-center pb-20">
				<p className={`${fontSizeClass} font-black text-white bg-gray-900/90 px-8 py-3 rounded-2xl shadow-2xl border border-gray-800 whitespace-nowrap transition-all`}>
					{text}
				</p>
			</div>
		</div>
	);
}
