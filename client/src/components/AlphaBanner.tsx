'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export default function AlphaBanner() {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <div className="bg-gradient-to-r from-warning to-destructive text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="flex items-center space-x-2">
            <span className="inline-block bg-white bg-opacity-20 text-white px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
              Alpha Version
            </span>
            <span className="text-sm md:text-base font-medium">
              GatherGrove is currently in alpha. Online payments and mobile app are not yet available.
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="ml-4 inline-flex items-center justify-center w-6 h-6 text-white hover:text-white/80 transition-colors duration-200"
          aria-label="Dismiss banner"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}