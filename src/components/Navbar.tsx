'use client'

import { useRouter } from 'next/navigation'

interface NavbarProps {
  title?: string
  backHref?: string
}

export default function Navbar({ title, backHref }: NavbarProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
      <button
        onClick={() => (backHref ? router.push(backHref) : router.back())}
        className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        aria-label="Quay lại"
      >
        <svg
          className="w-5 h-5 text-gray-300"
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
      {title && (
        <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
      )}
    </div>
  )
}
