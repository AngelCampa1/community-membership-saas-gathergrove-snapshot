import React from 'react'

interface ComparisonTableProps {
  headers: string[]
  rows: Array<Record<string, string>>
  caption?: string
  highlightColumn?: number
}

export function ComparisonTable({ headers, rows, caption, highlightColumn }: ComparisonTableProps) {
  return (
    <div className="my-6" data-ai-comparison="true">
      {caption && (
        <p className="mb-3 text-base font-semibold text-foreground md:hidden">{caption}</p>
      )}
      <div className="space-y-4 md:hidden">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 font-semibold text-foreground">{row[headers[0]]}</p>
            <div className="space-y-3">
              {headers.slice(1).map((header, index) => {
                const colIndex = index + 1
                return (
                  <div key={header} className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-[0.9fr_1.1fr] sm:gap-3">
                    <span className={`min-w-0 break-words ${colIndex === highlightColumn ? 'font-semibold text-primary' : 'font-medium text-foreground'}`}>
                      {header}
                    </span>
                    <span className={`min-w-0 break-words ${colIndex === highlightColumn ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {row[header] || 'Not listed'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <table className="hidden w-full border-collapse text-sm md:table">
        {caption && (
          <caption className="mb-2 text-left text-base font-semibold text-foreground">{caption}</caption>
        )}
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={h}
                className={`border-b border-border p-3 text-left font-semibold ${i === highlightColumn ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-muted/30' : ''}>
              {headers.map((h, colIndex) => (
                <td
                  key={h}
                  className={`border-b border-border/50 p-3 ${colIndex === highlightColumn ? 'bg-primary/5 font-medium' : 'text-muted-foreground'}`}
                >
                  {row[h] || 'Not listed'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
