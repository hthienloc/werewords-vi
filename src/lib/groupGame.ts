import { Player } from "@/types";

export const GROUP_ROLE_RULES: Record<number, { werewolf: number; seer: number; villager: number }> = {
  4: { werewolf: 1, seer: 1, villager: 1 },
  5: { werewolf: 1, seer: 1, villager: 2 },
  6: { werewolf: 1, seer: 1, villager: 3 },
  7: { werewolf: 2, seer: 1, villager: 3 },
  8: { werewolf: 2, seer: 1, villager: 4 },
};

export interface RoleInfo {
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export const ROLE_DETAILS: Record<string, RoleInfo> = {
  mayor: {
    name: "Thị trưởng",
    emoji: "🎗️",
    color: "bg-amber-900 border-amber-500",
    description: "Bạn là Thị trưởng. Sau khi mọi người xem xong vai trò, bạn sẽ chọn Từ bí mật. Hãy khéo léo giúp phe mình giành chiến thắng.",
  },
  werewolf: {
    name: "Ma sói",
    emoji: "🐺",
    color: "bg-red-900 border-red-500",
    description: "Bạn là Ma sói. Bạn sẽ biết Từ bí mật sau khi Thị trưởng chọn. Hãy ngăn phe Dân làng đoán trúng từ đó.",
  },
  seer: {
    name: "Tiên tri",
    emoji: "👁️",
    color: "bg-violet-900 border-violet-500",
    description: "Bạn là Tiên tri. Bạn sẽ biết Từ bí mật sau khi Thị trưởng chọn. Hãy gợi ý cho Dân làng đoán trúng mà không để lộ thân phận.",
  },
  villager: {
    name: "Dân làng",
    emoji: "🧑‍🌾",
    color: "bg-slate-800 border-slate-500",
    description: "Bạn là Dân làng. Bạn không biết gì cả. Hãy đặt câu hỏi để tìm ra Từ bí mật và tìm ra ai là Ma sói.",
  },
};

export type TokenType = 'correct' | 'wrong' | 'right' | 'close' | 'way-off';

export const TOKEN_DETAILS: Record<TokenType, { emoji: string; label: string; color: string }> = {
  'correct': { emoji: '🏆', label: 'Trúng phóc', color: 'bg-yellow-500' },
  'wrong': { emoji: '❌', label: 'Sai', color: 'bg-red-500' },
  'right': { emoji: '✅', label: 'Đúng', color: 'bg-blue-500' },
  'close': { emoji: '🎯', label: 'Gần', color: 'bg-green-500' },
  'way-off': { emoji: '🧊', label: 'Xa', color: 'bg-cyan-500' }
};

export const TOKEN_LIMITS: Record<import("@/types").TokenLimitMode, Partial<Record<TokenType, number>>> = {
  infinite: {},
  many: {
    wrong: 30,
    right: 30,
    close: 2,
    'way-off': 2,
  },
  few: {
    wrong: 15,
    right: 15,
    close: 1,
    'way-off': 1,
  }
};

export function assignRoles(playerNames: string[]): Player[] {
  const count = playerNames.length;
  
  // Create role pool: 1 Mayor, 1 Seer, 1 Werewolf, rest Villagers. Total = count + 1
  const rolesPool: Player['role'][] = ['mayor', 'seer', 'werewolf'];
  const villagerCount = (count + 1) - 3; // Subtract Mayor, Seer, Werewolf
  for (let i = 0; i < villagerCount; i++) {
    rolesPool.push('villager');
  }

  // Shuffle roles pool
  for (let i = rolesPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
  }

  // Ensure 'mayor' is not the leftover card (index N)
  if (rolesPool[count] === 'mayor') {
    // Swap with a random card from the player cards
    const randomIndex = Math.floor(Math.random() * count);
    const temp = rolesPool[count];
    rolesPool[count] = rolesPool[randomIndex];
    rolesPool[randomIndex] = temp;
  }

  const leftoverCard = rolesPool[count];
  
  const players = playerNames.map((name, index) => ({
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    name,
    role: rolesPool[index],
    subRole: undefined as Player['subRole'],
    hasViewed: false,
  }));

  // The player who got 'mayor' card takes the leftoverCard as their subRole
  const mayorPlayer = players.find(p => p.role === 'mayor');
  if (mayorPlayer) {
    mayorPlayer.subRole = leftoverCard as Player['subRole'];
  }

  return players;
}
