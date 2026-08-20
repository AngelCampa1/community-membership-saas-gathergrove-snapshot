interface PseoFaqProps {
  questions: Array<{ question: string; answer: string }>
  heading?: string
}

export function PseoFaq({ questions, heading ='Frequently Asked Questions' }: PseoFaqProps) {
  if (questions.length === 0) return null

  return (
    <section className="bg-gray-50  py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">{heading}</h2>
        <div className="space-y-6">
          {questions.map((faq, index) => (
            <div key={`faq-${index}`} className="rounded-lg border border-gray-200  bg-white  p-6">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
