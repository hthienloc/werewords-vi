"use client";

interface ResultPhaseProps {
	result: "villagers" | "werewolf" | null;
	endgameType: "find-seer" | "find-werewolf" | null;
	onSaveResult: (r: "villagers" | "werewolf") => void;
	onGoHome: () => void;
}

export default function ResultPhase({
	result,
	endgameType,
	onSaveResult,
	onGoHome,
}: ResultPhaseProps) {
	if (result === null) {
		const isFindSeer = endgameType === "find-seer";

		return (
			<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
				<div className="text-7xl">{isFindSeer ? "👁️" : "⏰"}</div>
				<h2 className="text-3xl font-extrabold text-white">
					{isFindSeer ? "Đoán trúng từ!" : "Hết giờ!"}
				</h2>
				<p className="text-gray-300 text-lg">
					{isFindSeer
						? "Ma sói có tìm được Tiên tri không?"
						: "Dân làng có tìm được Ma sói không?"}
				</p>

				<div className="w-full max-w-sm flex flex-col gap-4 mt-4">
					<button
						onClick={() => onSaveResult("villagers")}
						className="w-full bg-green-700 hover:bg-green-600 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
					>
						{isFindSeer ? "🎉 Ma sói đoán sai" : "🎉 Dân làng đoán đúng"}
					</button>
					<button
						onClick={() => onSaveResult("werewolf")}
						className="w-full bg-red-700 hover:bg-red-600 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
					>
						{isFindSeer ? "🐺 Ma sói đã tìm được" : "🐺 Dân làng đoán sai"}
					</button>
				</div>
			</div>
		);
	}

	const isFindSeer = endgameType === "find-seer";
	let resultTitle = "";
	let resultDesc = "";

	if (result === "villagers") {
		resultTitle = "Dân làng Thắng";
		resultDesc = isFindSeer
			? "Ma sói không tìm được Tiên tri."
			: "Dân làng đã tìm ra Ma sói.";
	} else {
		resultTitle = "Ma sói Thắng";
		resultDesc = isFindSeer
			? "Ma sói đã tìm ra Tiên tri!"
			: "Dân làng không tìm ra Ma sói.";
	}

	return (
		<div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
			<div className="text-9xl mb-4">
				{result === "villagers" ? "🎉" : "🐺"}
			</div>
			<div className="space-y-2">
				<h2 className="text-4xl font-black text-white uppercase tracking-tighter">
					{resultTitle}
				</h2>
				<p className="text-gray-400 text-xl font-medium italic">
					{resultDesc}
				</p>
			</div>

			<button
				onClick={onGoHome}
				className="mt-8 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xl px-12 py-5 rounded-2xl border border-gray-700 transition-all active:scale-95"
			>
				🏠 Quay lại Trang chủ
			</button>
		</div>
	);
}
