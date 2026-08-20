interface BlogTagBadgeProps {
  tag: string
}

export function BlogTagBadge({ tag }: BlogTagBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50  px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      {tag}
    </span>
  )
}
