import fs from 'fs'
import path from 'path'
import { GET as getAiData } from '@/app/ai-data.json/route'
import { GET as getLlms } from '@/app/llms.txt/route'
import { GET as getLlmsFull } from '@/app/llms-full.txt/route'
import { generateSitemapEntries } from '@/app/sitemap.xml/sitemap-data'
import { SITE_URL } from '@/lib/site-config'
import { FEATURE_PAGES } from '@/lib/data/feature-pages'

describe('feature SEO and AI discovery coverage', () => {
  it('lists every feature page in sitemap, llms.txt, llms-full.txt, and ai-data.json', async () => {
    const sitemapUrls = generateSitemapEntries().map((entry) => entry.url)
    const llmsText = await getLlms().text()
    const llmsFullText = await getLlmsFull().text()
    const aiData = await getAiData().json()

    FEATURE_PAGES.forEach((page) => {
      const absoluteUrl = `${SITE_URL}${page.url}`
      expect(sitemapUrls).toContain(absoluteUrl)
      expect(llmsText).toContain(absoluteUrl)
      expect(llmsFullText).toContain(absoluteUrl)
      expect(aiData.useCases.some((entry: { url: string }) => entry.url === absoluteUrl)).toBe(true)
    })
  })

  it('keeps scoped feature and AI-discovery files free of em dashes', () => {
    const scopedFiles = [
      'src/app/features/page.tsx',
      'src/app/features/[slug]/page.tsx',
      'src/lib/data/use-cases.ts',
      'src/lib/data/feature-pages.ts',
      'src/app/llms.txt/route.ts',
      'src/app/llms-full.txt/route.ts',
      'src/app/ai-data.json/route.ts',
      'src/app/sitemap.xml/sitemap-data.ts',
    ]

    scopedFiles.forEach((relativePath) => {
      const contents = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
      expect(contents).not.toMatch(/[\u2013\u2014]/)
    })
  })
})
