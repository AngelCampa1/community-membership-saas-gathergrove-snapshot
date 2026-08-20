import React from 'react'

interface DefinitionBoxProps {
  term: string
  definition: string
  slug?: string
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function DefinitionBox({ term, definition, slug }: DefinitionBoxProps) {
  const id = `definition-${slug || slugify(term)}`
  return (
    <dl
      id={id}
      data-ai-definition="true"
      className="border border-border/50 bg-muted/30 rounded-lg p-4 my-4"
    >
      <dt className="font-semibold text-foreground text-base">{term}</dt>
      <dd className="text-muted-foreground mt-1 text-sm leading-relaxed">{definition}</dd>
    </dl>
  )
}
