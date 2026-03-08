"use client";

import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
	const { state, dispatch } = useApp();
	const router = useRouter();
	const { settings } = state;

	const updateSetting = (key: keyof typeof settings, value: number) => {
		dispatch({
			type: "UPDATE_SETTINGS",
			payload: { [key]: value },
		});
	};

	return (
		<main className="flex flex-col min-h-screen bg-gray-950 text-white">
			{/* Header */}
			<header className="p-6 flex items-center gap-4 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 border-b border-gray-800">
				<button
					onClick={() => router.back()}
					className="p-2 hover:bg-gray-800 rounded-full transition-colors"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				<h1 className="text-xl font-black uppercase tracking-tight">Cài đặt</h1>
				<button
					onClick={() => {
						dispatch({
							type: "SET_SETTINGS",
							payload: {
								selectedPackIds: ["pack-food"],
								timerDuration: 180,
								initialNightDuration: 5,
								mayorRoleDuration: 5,
								mayorWordDuration: 10,
								narrationDuration: 8,
								findSeerDuration: 15,
								findWerewolfDuration: 60,
								filterDifficulty: "all",
								selectedRoleIds: ["role-seer", "role-werewolf", "role-villager"],
							},
						});
					}}
					className="ml-auto text-xs font-bold text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-widest border border-gray-800 px-3 py-1 rounded-full"
				>
					Đặt lại
				</button>
			</header>

			<div className="flex-1 p-6 space-y-8 max-w-lg mx-auto w-full pb-24">
				<section className="space-y-6">
					<h2 className="text-purple-400 font-bold text-sm uppercase tracking-wider">
						Thời gian các giai đoạn
					</h2>

					{/* Timer Duration */}
					<div className="space-y-3 bg-gray-900/40 p-5 rounded-2xl border border-gray-800">
						<div className="flex justify-between items-center">
							<label className="font-bold text-gray-200">Thảo luận</label>
							<span className="text-purple-400 font-black text-xl">
								{Math.floor(settings.timerDuration / 60)}:{(settings.timerDuration % 60).toString().padStart(2, '0')}
							</span>
						</div>
						<input
							type="range"
							min="60"
							max="600"
							step="30"
							value={settings.timerDuration}
							onChange={(e) => updateSetting("timerDuration", parseInt(e.target.value))}
							className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
						/>
						<p className="text-xs text-gray-500">Thời gian dân làng đặt câu hỏi.</p>
					</div>

					{/* Initial Night Duration */}
					<div className="space-y-3 bg-gray-900/40 p-5 rounded-2xl border border-gray-800">
						<div className="flex justify-between items-center">
							<label className="font-bold text-gray-200">Chuẩn bị nhắm mắt</label>
							<span className="text-purple-400 font-black text-xl">{settings.initialNightDuration}s</span>
						</div>
						<input
							type="range"
							min="2"
							max="15"
							step="1"
							value={settings.initialNightDuration}
							onChange={(e) => updateSetting("initialNightDuration", parseInt(e.target.value))}
							className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
						/>
						<p className="text-xs text-gray-500">Thời gian chờ sau câu 'Mọi người nhắm mắt lại'.</p>
					</div>

					{/* Mayor Role Duration */}
					<div className="space-y-3 bg-gray-900/40 p-5 rounded-2xl border border-gray-800">
						<div className="flex justify-between items-center">
							<label className="font-bold text-gray-200">Thị trưởng xem vai</label>
							<span className="text-purple-400 font-black text-xl">{settings.mayorRoleDuration}s</span>
						</div>
						<input
							type="range"
							min="5"
							max="30"
							step="1"
							value={settings.mayorRoleDuration}
							onChange={(e) => updateSetting("mayorRoleDuration", parseInt(e.target.value))}
							className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
						/>
					</div>

					{/* Mayor Word Duration */}
					<div className="space-y-3 bg-gray-900/40 p-5 rounded-2xl border border-gray-800">
						<div className="flex justify-between items-center">
							<label className="font-bold text-gray-200">Thị trưởng xem từ</label>
							<span className="text-purple-400 font-black text-xl">{settings.mayorWordDuration}s</span>
						</div>
						<input
							type="range"
							min="5"
							max="30"
							step="1"
							value={settings.mayorWordDuration}
							onChange={(e) => updateSetting("mayorWordDuration", parseInt(e.target.value))}
							className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
						/>
					</div>

					{/* Narration Duration */}
					<div className="space-y-3 bg-gray-900/40 p-5 rounded-2xl border border-gray-800">
						<div className="flex justify-between items-center">
							<label className="font-bold text-gray-200">Vai trò thức dậy</label>
							<span className="text-purple-400 font-black text-xl">{settings.narrationDuration}s</span>
						</div>
						<input
							type="range"
							min="5"
							max="20"
							step="1"
							value={settings.narrationDuration}
							onChange={(e) => updateSetting("narrationDuration", parseInt(e.target.value))}
							className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
						/>
						<p className="text-xs text-gray-500">Thời gian mỗi vai trò thực hiện kỹ năng trong đêm.</p>
					</div>

					{/* Find Seer Duration */}
					<div className="space-y-3 bg-gray-900/40 p-5 rounded-2xl border border-gray-800">
						<div className="flex justify-between items-center">
							<label className="font-bold text-gray-200">Ma sói tìm Tiên tri</label>
							<span className="text-purple-400 font-black text-xl">{settings.findSeerDuration}s</span>
						</div>
						<input
							type="range"
							min="10"
							max="60"
							step="5"
							value={settings.findSeerDuration}
							onChange={(e) => updateSetting("findSeerDuration", parseInt(e.target.value))}
							className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
						/>
					</div>

					{/* Find Werewolf Duration */}
					<div className="space-y-3 bg-gray-900/40 p-5 rounded-2xl border border-gray-800">
						<div className="flex justify-between items-center">
							<label className="font-bold text-gray-200">Dân làng tìm Ma sói</label>
							<span className="text-purple-400 font-black text-xl">{settings.findWerewolfDuration}s</span>
						</div>
						<input
							type="range"
							min="30"
							max="180"
							step="10"
							value={settings.findWerewolfDuration}
							onChange={(e) => updateSetting("findWerewolfDuration", parseInt(e.target.value))}
							className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
						/>
					</div>
				</section>
			</div>

			{/* Footer Action */}
			<div className="fixed bottom-0 left-0 right-0 p-6 bg-gray-950/80 backdrop-blur-lg border-t border-gray-800">
				<button
					onClick={() => router.back()}
					className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-purple-900/20"
				>
					LƯU & QUAY LẠI
				</button>
			</div>
		</main>
	);
}
