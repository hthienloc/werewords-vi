"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function HomePage() {
	const { state } = useApp();

	return (
		<main className="flex flex-col min-h-screen items-center justify-center px-6 py-10">
			<div className="flex flex-col items-center mb-10">
				<span className="text-7xl mb-3" role="img" aria-label="logo">
					🐺💬
				</span>
				<h1 className="text-4xl font-extrabold text-white tracking-tight">
					Werewords
				</h1>
				<p className="text-purple-400 font-semibold text-lg mt-1">
					Việt Nam
				</p>
			</div>

			{/* Main actions */}
			<div className="w-full max-w-sm flex flex-col gap-4">
				<Link
					href="/game/setup"
					className="w-full bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 text-white text-xl font-extrabold py-6 rounded-2xl text-center transition-all shadow-xl shadow-indigo-900/40 scale-105 mb-2"
				>
					👥 Chơi theo nhóm
					<div className="text-[10px] uppercase tracking-widest font-bold opacity-70 mt-1">Pass & Play hoàn chỉnh</div>
				</Link>

				<Link
					href="/setup"
					className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-white text-lg font-semibold py-4 rounded-2xl text-center transition-colors border border-gray-700"
				>
					🃏 Dùng kèm bộ bài giấy
					<div className="text-[10px] uppercase tracking-widest font-medium opacity-50 mt-1">Chế độ trợ lý (Solo)</div>
				</Link>

				<Link
					href="/words"
					className="w-full bg-gray-800/40 hover:bg-gray-800 active:bg-gray-900 text-white/70 text-sm font-medium py-3 rounded-xl text-center transition-colors border border-white/5"
				>
					📚 Quản lý bộ từ
				</Link>

				<div className="grid grid-cols-2 gap-3 mb-3">
					<Link
						href="/history"
						className="bg-gray-800/40 hover:bg-gray-800 text-white/70 text-xs font-medium py-3 rounded-xl text-center border border-white/5"
					>
						📜 Lịch sử
					</Link>
					<Link
						href="/settings"
						className="bg-gray-800/40 hover:bg-gray-800 text-white/70 text-xs font-medium py-3 rounded-xl text-center border border-white/5"
					>
						⚙️ Cài đặt
					</Link>
				</div>

				<Link
					href="/rules"
					className="w-full bg-indigo-900/20 hover:bg-indigo-900/30 text-indigo-300 text-sm font-bold py-3 rounded-xl text-center transition-colors border border-indigo-500/20"
				>
					📜 Xem luật chơi
				</Link>
			</div>
			
			<footer className="mt-12 text-center">
				<p className="text-gray-500 text-sm font-medium">
					Phát triển bởi: <Link href="https://github.com/hthienloc" target="_blank" rel="noopener noreferrer" className="text-purple-400 font-bold hover:underline">hthienloc</Link>
				</p>
			</footer>
		</main>
	);
}
