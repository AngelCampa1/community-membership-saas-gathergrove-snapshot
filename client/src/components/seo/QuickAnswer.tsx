import React from 'react'

interface QuickAnswerProps {
  question: string
  answer: string
}

export function QuickAnswer({ question, answer }: QuickAnswerProps) {
  const sentences = answer.split('. ')
  const firstSentence = sentences[0] + (sentences.length > 1 ? '.' : '')
  const rest = sentences.length > 1 ? sentences.slice(1).join('. ') : ''

  return (
    <div
      data-ai-answer="true"
      role="region"
      aria-label={`Quick answer: ${question}`}
      className="border-l-4 border-primary bg-primary/5 rounded-r-lg p-4 my-4"
    >
      <h3 className="font-semibold text-foreground text-base mb-2">{question}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        <strong>{firstSentence}</strong>{rest ? ` ${rest}` : ''}
      </p>
    </div>
  )
}
