'use client'

interface BlogCategoryFilterProps {
  categories: string[]
  activeCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export function BlogCategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: BlogCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => onCategoryChange(null)}
        aria-pressed={activeCategory === null}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          activeCategory === null
            ?'bg-emerald-600 text-white'
            :'bg-gray-100  text-gray-700  hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          aria-pressed={activeCategory === category}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === category
              ?'bg-emerald-600 text-white'
              :'bg-gray-100  text-gray-700  hover:bg-gray-200'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
