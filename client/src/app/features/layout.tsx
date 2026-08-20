import { MinimalistHeader } from '@/components/shared/MinimalistHeader'
import { Footer } from '@/components/shared/Footer'

export default function UseCaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MinimalistHeader />
      {children}
      <Footer />
    </>
  )
}
