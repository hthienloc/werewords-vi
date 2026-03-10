interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard'
  size?: 'sm' | 'md'
}

const labels = {
  easy: 'Dễ',
  medium: 'Vừa',
  hard: 'Khó',
}

const colors = {
  easy: 'bg-green-900/40 text-green-400 border border-green-800',
  medium: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800',
  hard: 'bg-red-900/40 text-red-400 border border-red-800',
}

export default function DifficultyBadge({
  difficulty,
  size = 'sm',
}: DifficultyBadgeProps) {
  return (
    <span
      className={`
        inline-block rounded-full font-medium
        ${colors[difficulty]}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
      `}
    >
      {labels[difficulty]}
    </span>
  )
}
