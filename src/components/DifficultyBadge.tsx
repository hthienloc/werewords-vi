interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard'
  size?: 'sm' | 'md'
}

const labels = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
}

const colors = {
  easy: 'bg-green-900 text-green-300 border border-green-700',
  medium: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
  hard: 'bg-red-900 text-red-300 border border-red-700',
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
