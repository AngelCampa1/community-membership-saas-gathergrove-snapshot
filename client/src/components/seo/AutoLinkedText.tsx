import Link from'next/link'
import { getAutoLinkTargets } from'@/lib/data/content-links'
import type { ContentPageType } from'@/lib/data/content-links'

interface AutoLinkedTextProps {
  text: string
  currentType: ContentPageType
  currentSlug: string
  maxLinks?: number
  className?: string
}

/**
 * Renders text with up to `maxLinks` keyword mentions automatically converted
 * to internal Next.js Links. Prioritizes glossary terms and feature titles.
 * Longer phrases are matched first to prevent partial overlaps.
 */
export function AutoLinkedText({
  text,
  currentType,
  currentSlug,
  maxLinks = 3,
  className,
}: AutoLinkedTextProps) {
  const targets = getAutoLinkTargets({ currentType, currentSlug })

  // Find up to maxLinks non-overlapping matches
  const matches: Array<{ start: number; end: number; phrase: string; href: string }> = []
  const lowerText = text.toLowerCase()

  for (const target of targets) {
    if (matches.length >= maxLinks) break

    const lowerPhrase = target.phrase.toLowerCase()
    const idx = lowerText.indexOf(lowerPhrase)
    if (idx === -1) continue

    // Ensure whole-word boundary (not inside another word)
    const before = idx === 0 ?'' : text[idx - 1]
    const after = idx + lowerPhrase.length >= text.length ?'' : text[idx + lowerPhrase.length]
    const wordBoundary = /[\w]/.test(before) === false && /[\w]/.test(after) === false

    if (!wordBoundary) continue

    // No overlaps with existing matches
    const overlaps = matches.some(
      (m) => idx < m.end && idx + lowerPhrase.length > m.start
    )
    if (overlaps) continue

    matches.push({ start: idx, end: idx + lowerPhrase.length, phrase: target.phrase, href: target.href })
  }

  if (matches.length === 0) return <span className={className}>{text}</span>

  // Sort matches by position and build fragments
  matches.sort((a, b) => a.start - b.start)

  const fragments: React.ReactNode[] = []
  let cursor = 0

  for (const match of matches) {
    if (cursor < match.start) {
      fragments.push(text.slice(cursor, match.start))
    }
    fragments.push(
      <Link
        key={match.start}
        href={match.href}
        className="text-emerald-700  underline underline-offset-2 hover:text-emerald-900  transition-colors"
      >
        {text.slice(match.start, match.end)}
      </Link>
    )
    cursor = match.end
  }

  if (cursor < text.length) {
    fragments.push(text.slice(cursor))
  }

  return <span className={className}>{fragments}</span>
}
