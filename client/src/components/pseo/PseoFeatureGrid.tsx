import { CheckCircle } from'lucide-react'

interface PseoFeatureGridProps {
  heading: string
  features: string[]
}

export function PseoFeatureGrid({ heading, features }: PseoFeatureGridProps) {
  if (features.length === 0) return null

  return (
    <section className="bg-gray-50  py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">{heading}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-start gap-3 rounded-lg bg-white  p-6 shadow-sm"
            >
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
