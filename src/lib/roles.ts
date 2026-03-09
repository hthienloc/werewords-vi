import { GameRole } from "@/types";

export const ALL_ROLES: GameRole[] = [
	{
		id: "role-seer",
		name: "Nhà tiên tri",
		emoji: "👁️",
		description: "Biết từ bí mật và phải giúp dân làng đoán đúng.",
		nightDescription: "Nhà tiên tri xem từ.",
		priority: 10,
		isDefault: true,
		complexity: "easy",
	},
	{
		id: "role-fortune-teller",
		name: "Nhà bói toán",
		emoji: "🔮",
		description: "Biết chữ cái đầu tiên của các từ trong từ bí mật.",
		nightDescription: "Nhà bói toán xem chữ cái đầu.",
		priority: 11,
		isDefault: false,
		complexity: "medium",
	},
	{
		id: "role-apprentice",
		name: "Hầu cận",
		emoji: "📜",
		description:
			"Trở thành Nhà tiên tri nếu Thị trưởng là Nhà tiên tri/Bói toán.",
		nightDescription: "Hầu cận xem từ.",
		priority: 12,
		isDefault: false,
		complexity: "hard",
	},
	{
		id: "role-werewolf",
		name: "Ma sói",
		emoji: "🐺",
		description: "Biết từ bí mật và phải ngăn dân làng đoán đúng.",
		nightDescription: "Ma sói xem từ.",
		priority: 20,
		isDefault: true,
		complexity: "easy",
	},
	{
		id: "role-minion",
		name: "Tay sai",
		emoji: "🧛",
		description: "Biết ai là Ma sói.",
		nightDescription: "Tay sai xem Ma sói.",
		priority: 21,
		isDefault: false,
		complexity: "medium",
	},
	{
		id: "role-beholder",
		name: "Kẻ soi mói",
		emoji: "👁️‍🗨️",
		description: "Biết ai là Nhà tiên tri/Bói toán/Hầu cận.",
		nightDescription: "Kẻ soi mói xem Nhà tiên tri.",
		priority: 22,
		isDefault: false,
		complexity: "medium",
	},
	{
		id: "role-mason",
		name: "Thợ xây",
		emoji: "🧱",
		description: "Biết những Thợ xây khác là ai.",
		nightDescription: "Thợ xây tìm nhau.",
		priority: 30,
		isDefault: false,
		complexity: "hard",
	},
	{
		id: "role-thing",
		name: "Sinh vật lạ",
		emoji: "👾",
		description: "Vỗ vai người bên cạnh để họ biết bạn là dân làng.",
		nightDescription: "Sinh vật lạ vỗ vai.",
		priority: 40,
		isDefault: false,
		complexity: "hard",
	},
	{
		id: "role-villager",
		name: "Dân làng",
		emoji: "🧑‍🌾",
		description: "Đoán từ bí mật dựa trên câu hỏi.",
		priority: 100,
		isDefault: true,
		complexity: "easy",
	},
];

export const DEFAULT_ROLE_IDS = ALL_ROLES.filter((r) => r.isDefault).map(
	(r) => r.id
);

// Roles that get to see the secret word during the night narration phase
export const WORD_ROLES = new Set([
	"role-seer",
	"role-fortune-teller",
	"role-apprentice",
	"role-werewolf",
]);
