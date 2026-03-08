interface TimerDisplayProps {
  seconds: number
  warning?: boolean
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

export default function TimerDisplay({ seconds, warning }: TimerDisplayProps) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <div
      className={`
        text-8xl font-bold tabular-nums transition-colors duration-300
        ${warning ? 'text-red-400' : 'text-white'}
      `}
    >
      {pad(mins)}:{pad(secs)}
    </div>
  )
}
