import { MinimalistHeader } from '@/components/shared/MinimalistHeader'
import { Footer } from '@/components/shared/Footer'

export default function ClubTypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MinimalistHeader />
      {children}
      <Footer />
    </>
  )
}
