"use client";

import Navbar from "@/components/Navbar";

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mb-8">
			<h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">
				{title}
			</h2>
			{children}
		</section>
	);
}

function RoleCard({
	emoji,
	name,
	color,
	children,
}: {
	emoji: string;
	name: string;
	color: string;
	children: React.ReactNode;
}) {
	return (
		<div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex gap-3">
			<span className="text-3xl flex-shrink-0">{emoji}</span>
			<div>
				<h3 className={`font-bold mb-1 ${color}`}>{name}</h3>
				<p className="text-sm text-gray-400 leading-relaxed">
					{children}
				</p>
			</div>
		</div>
	);
}

export default function RulesPage() {
	return (
		<div className="min-h-screen flex flex-col bg-gray-950 text-gray-200">
			<Navbar title="Luật chơi Werewords" backHref="/" />

			<div className="flex-1 px-5 py-6 max-w-2xl mx-auto w-full leading-relaxed text-gray-300">
				{/* Overview */}
				<Section title="🎯 Tổng quan">
					<p className="text-sm leading-relaxed">
						Werewords là trò chơi đoán từ theo nhóm (4–20 người).{" "}
						<strong className="text-white">Thị trưởng</strong> biết một{" "}
						<strong className="text-white">Từ bí mật</strong> và dẫn
						dắt ván chơi bằng cách trả lời câu hỏi Có/Không. Phe Dân
						làng cố đoán đúng từ đó, trong khi phe Ma sói âm mưu phá
						banh.
					</p>
				</Section>

				{/* Setup */}
				<Section title="🃏 Chuẩn bị">
					<ol className="list-decimal list-inside space-y-2 text-sm">
						<li>
							Lấy lá <strong className="text-white">Thị trưởng</strong>
							,{" "}
							<strong className="text-white">Nhà tiên tri</strong>
							, và{" "}
							<strong className="text-white">1 Ma sói</strong>.
							Thêm lá{" "}
							<strong className="text-white">Dân làng</strong> sao
							cho tổng số lá = số người chơi + 1.
						</li>
						<li>
							Với{" "}
							<strong className="text-white">7–11 người</strong>:
							dùng 2 Ma sói. Với{" "}
							<strong className="text-white">12+ người</strong>:
							dùng 3 Ma sói.
						</li>
						<li>
							Xáo bài và phát úp mỗi người 1 lá. Để lại 1 lá ở
							giữa bàn (lá bí mật của Thị trưởng).
						</li>
						<li>
							Người có lá{" "}
							<strong className="text-white">Thị trưởng</strong> úp lá
							đó xuống, rút lá ở giữa xem bí mật — đây là vai trò
							thật của Thị trưởng. Sau đó Thị trưởng mở app, chọn từ bí mật
							và để app dẫn đêm.
						</li>
					</ol>
				</Section>

				{/* Night Phase */}
				<Section title="🌙 Giai đoạn Đêm (App dẫn dắt)">
					<p className="text-sm mb-3">
						Mọi người nhắm mắt. App lần lượt đánh thức từng vai trò:
					</p>
					<ol className="list-decimal list-inside space-y-2 text-sm">
						<li>
							<strong className="text-white">Thị trưởng</strong> mở
							mắt, chọn vai trò bí mật trong app, rồi chọn Từ bí
							mật.
						</li>
						<li>
							<strong className="text-white">Nhà tiên tri</strong>{" "}
							mở mắt, xem Từ bí mật, nhắm mắt lại.
						</li>
						<li>
							<strong className="text-white">Ma sói</strong> mở
							mắt, xem Từ bí mật (và nhận diện Ma sói khác nếu
							có), nhắm mắt lại.
						</li>
						<li>
							Các vai trò đặc biệt khác được đánh thức theo thứ tự
							của app.
						</li>
						<li>Mọi người mở mắt — ban ngày bắt đầu!</li>
					</ol>
				</Section>

				{/* Day Phase */}
				<Section title="☀️ Giai đoạn Ban ngày">
					<p className="text-sm mb-3">
						Đồng hồ đếm ngược. Người chơi lần lượt đặt câu hỏi{" "}
						<strong className="text-white">Có/Không</strong> cho
						Thị trưởng. Thị trưởng{" "}
						<strong className="text-white">không được nói</strong> —
						chỉ trả lời bằng thẻ token:
					</p>
					<div className="grid grid-cols-2 gap-2 mb-4">
						{[
							{
								token: "✅ Có / ❌ Không",
								desc: "Trả lời thẳng câu hỏi",
							},
							{
								token: "⚠️ Có lẽ",
								desc: "Không chắc chắn / một phần đúng",
							},
							{
								token: "🎯 Suýt đúng",
								desc: "Câu hỏi rất gần với từ",
							},
							{
								token: "🚫 Lạc đường",
								desc: "Đang đi sai hướng hoàn toàn (dùng tùy ý, không thay token Có/Không)",
							},
						].map(({ token, desc }) => (
							<div
								key={token}
								className="bg-gray-900 rounded-xl p-3 border border-gray-800"
							>
								<p className="font-bold text-white text-sm">
									{token}
								</p>
								<p className="text-xs text-gray-500 mt-0.5">
									{desc}
								</p>
							</div>
						))}
					</div>
					<div className="bg-yellow-950/40 border border-yellow-800/50 rounded-xl p-3 text-sm text-yellow-300">
						<strong>Lưu ý:</strong> Để đoán đúng, phải hỏi trực tiếp
						toàn bộ từ — ví dụ:{" "}
						<em>"Từ đó có phải là 'ếch' không?"</em>. Hỏi gián tiếp
						không tính là đoán đúng.
					</div>
				</Section>

				{/* End conditions */}
				<Section title="⚖️ Kết thúc ván chơi">
					<div className="space-y-4">
						<div className="border-l-4 border-green-500 pl-4">
							<h3 className="font-bold text-white mb-1">
								Dân làng đoán ĐÚNG từ bí mật:
							</h3>
							<p className="text-sm text-gray-400">
								Ma sói lộ diện — có{" "}
								<strong className="text-white">15 giây</strong>{" "}
								để chỉ ra ai là Nhà tiên tri. Nếu chỉ đúng →{" "}
								<span className="text-red-400">
									Ma sói thắng
								</span>
								. Nếu chỉ sai →{" "}
								<span className="text-green-400">
									Dân làng thắng
								</span>
								. (Nếu có 2 Ma sói, cả hai cùng bỏ phiếu; chỉ
								cần 1 người trúng Nhà tiên tri là Ma sói thắng.)
							</p>
						</div>
						<div className="border-l-4 border-red-500 pl-4">
							<h3 className="font-bold text-white mb-1">
								Hết giờ / Hết token mà chưa đoán đúng:
							</h3>
							<p className="text-sm text-gray-400">
								Tất cả thảo luận{" "}
								<strong className="text-white">1 phút</strong>,
								sau đó cùng chỉ vào người nghi là Ma sói. Người
								bị chỉ nhiều nhất lộ bài — nếu là Ma sói →{" "}
								<span className="text-green-400">
									Dân làng thắng
								</span>
								. Nếu không →{" "}
								<span className="text-red-400">
									Ma sói thắng
								</span>
								. Khi hòa phiếu, tất cả người liên quan lật bài;
								có 1 Ma sói cũng tính Dân làng thắng.
							</p>
						</div>
					</div>
				</Section>

				{/* Special Thị trưởng roles */}
				<Section title="👑 Thị trưởng đặc biệt">
					<div className="space-y-3">
						<RoleCard
							emoji="🐺"
							name="Thị trưởng-Ma sói"
							color="text-red-400"
						>
							Thị trưởng là Ma sói — muốn dân làng đoán sai. Trong
							ngày, Thị trưởng có thể trả lời gây hiểu nhầm để dẫn mọi
							người đi lạc hướng.
						</RoleCard>
						<RoleCard
							emoji="👁️"
							name="Thị trưởng-Nhà tiên tri"
							color="text-blue-400"
						>
							Thị trưởng là Nhà tiên tri — muốn dân làng đoán đúng
							nhưng không có Nhà tiên tri hỗ trợ. Nên chọn từ dễ
							hơn để bù lại.
						</RoleCard>
					</div>
				</Section>

				{/* Roles */}
				<Section title="🎭 Vai trò đặc biệt (Deluxe)">
					<div className="space-y-3">
						<RoleCard
							emoji="🔮"
							name="Nhà bói toán"
							color="text-purple-400"
						>
							Biết chữ cái đầu của mỗi từ trong Từ bí mật. Phe Dân
							làng.
						</RoleCard>
						<RoleCard
							emoji="📜"
							name="Hầu cận"
							color="text-purple-400"
						>
							Nếu Thị trưởng là Nhà tiên tri hoặc Nhà bói toán, Hầu cận
							sẽ được đánh thức và biết Từ bí mật (đóng vai trò
							Nhà tiên tri thay thế).
						</RoleCard>
						<RoleCard
							emoji="🧛"
							name="Tay sai"
							color="text-red-400"
						>
							Phe Ma sói. Biết ai là Ma sói nhưng không biết Từ bí
							mật. Cố ngăn dân làng đoán đúng.
						</RoleCard>
						<RoleCard
							emoji="👁️‍🗨️"
							name="Kẻ soi mói"
							color="text-blue-400"
						>
							Biết ai là Nhà tiên tri/Nhà bói toán/Hầu cận. Phe
							Dân làng.
						</RoleCard>
						<RoleCard
							emoji="🧱"
							name="Thợ xây"
							color="text-blue-400"
						>
							Biết các Thợ xây khác là ai. Phe Dân làng.
						</RoleCard>
						<RoleCard
							emoji="👾"
							name="Sinh vật lạ"
							color="text-blue-400"
						>
							Đêm đến, vỗ vai người ngồi kế bên để báo hiệu "tôi
							là Dân làng". Phe Dân làng.
						</RoleCard>
					</div>
				</Section>

				{/* Strategy */}
				<Section title="💡 Chiến thuật cơ bản">
					<div className="space-y-2 text-sm">
						<div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-3">
							<strong className="text-blue-300">
								Phe Dân làng:
							</strong>
							<p className="text-gray-400 mt-1">
								Chú ý ai đặt câu hỏi "lãng". Nhà tiên tri nên
								giúp dẫn hướng câu hỏi nhưng đừng quá lộ liễu để
								Ma sói nhận ra.
							</p>
						</div>
						<div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3">
							<strong className="text-red-300">
								Phe Ma sói:
							</strong>
							<p className="text-gray-400 mt-1">
								Đặt câu hỏi không có ích, tiêu tốn token. Quan
								sát để nhận ra ai là Nhà tiên tri — người có vẻ
								"biết" nhiều nhất.
							</p>
						</div>
					</div>
				</Section>

				<p className="text-center text-gray-600 text-xs mt-8">
					Nguồn: luật chơi chính thức Werewords 2nd Edition — Bézier
					Games
				</p>
			</div>
		</div>
	);
}
