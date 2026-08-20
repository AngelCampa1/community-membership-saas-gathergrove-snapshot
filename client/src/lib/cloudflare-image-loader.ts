/**
 * Custom Next.js image loader for Cloudflare Workers (Free plan).
 *
 * Cloudflare image resizing (/cdn-cgi/image/) requires Pro plan or higher.
 * This loader returns the original image URL without transformation so all
 * images load correctly on the Free plan. Upgrade to Pro to enable automatic
 * WebP/AVIF conversion and responsive resizing.
 *
 * @see https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */
export default function cloudflareLoader({
  src,
}: {
  src: string
  width: number
  quality?: number
}) {
  // Return src as-is — works for both external URLs and local /public paths
  return src
}
