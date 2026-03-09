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
	// Dynamically adjust font size based on text length to prevent overflow
	const getFontSize = (str: string) => {
		if (str.length > 20) return "text-xl md:text-2xl";
		if (str.length > 15) return "text-2xl md:text-3xl";
		if (str.length > 10) return "text-3xl md:text-4xl";
		return "text-4xl md:text-5xl lg:text-6xl";
	};

	const fontSizeClass = getFontSize(text);
	const bubbleStyle = "font-black text-white bg-gray-900/90 backdrop-blur-md px-6 py-3 md:px-10 md:py-4 rounded-[2rem] shadow-2xl border border-gray-800/50 whitespace-nowrap transition-all duration-500 scale-in-center overflow-visible";

	return (
		<div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
			{/* CENTRAL HUB - Progress & Role */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center bg-gray-950/90 rounded-full backdrop-blur-xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
				{progress !== undefined && (
					<svg className="absolute inset-0 w-full h-full -rotate-90 scale-95" viewBox="0 0 100 100">
						<circle
							cx="50"
							cy="50"
							r="46"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							className="text-gray-800/50"
						/>
						<circle
							cx="50"
							cy="50"
							r="46"
							fill="none"
							stroke="currentColor"
							strokeWidth="5"
							strokeDasharray="289"
							strokeDashoffset={289 * (1 - progress / 100)}
							strokeLinecap="round"
							className="text-purple-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(168,85,247,0.5)]"
						/>
					</svg>
				)}
				<div className="z-10 text-center flex flex-col items-center">
					<span className="text-purple-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">
						Vào vai
					</span>
					<span className="text-white font-black text-xl md:text-2xl tracking-tighter whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
						{roleName}
					</span>
				</div>
			</div>

			{/* TOP BLOCK - Faces opposite side (outward) */}
			<div className="absolute top-10 left-1/2 -translate-x-1/2 rotate-180">
				<div className={bubbleStyle}>
					<span className={fontSizeClass}>{text}</span>
				</div>
			</div>

			{/* BOTTOM BLOCK - Faces player side (outward) */}
			<div className="absolute bottom-10 left-1/2 -translate-x-1/2">
				<div className={bubbleStyle}>
					<span className={fontSizeClass}>{text}</span>
				</div>
			</div>

			{/* LEFT BLOCK - Faces left side (outward) */}
			<div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 md:-translate-x-[15%] rotate-90 origin-center">
				<div className={bubbleStyle}>
					<span className={fontSizeClass}>{text}</span>
				</div>
			</div>

			{/* RIGHT BLOCK - Faces right side (outward) */}
			<div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 md:translate-x-[15%] -rotate-90 origin-center">
				<div className={bubbleStyle}>
					<span className={fontSizeClass}>{text}</span>
				</div>
			</div>

			<style jsx>{`
				@keyframes scaleIn {
					from { opacity: 0; transform: scale(0.8); }
					to { opacity: 1; transform: scale(1); }
				}
				.scale-in-center {
					animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
				}
			`}</style>
		</div>
	);
}
