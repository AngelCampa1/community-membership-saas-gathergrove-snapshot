import { ImageResponse } from 'next/og'
import { SITE_DISPLAY_DOMAIN } from './site-config'

interface OgImageTemplateProps {
  title: string
  subtitle?: string
  category?: string
}

export function buildOgImageResponse({
  title,
  subtitle,
  category,
}: OgImageTemplateProps): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #064e3b 0%, #0d9488 100%)',
          padding: '80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* GatherGrove branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <span style={{ color: '#a7f3d0', fontSize: '20px', fontWeight: 600 }}>
            GatherGrove
          </span>
        </div>

        {/* Category badge */}
        {category !== undefined && category !== '' && (
          <div
            style={{
              display: 'flex',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '6px',
              padding: '6px 14px',
              marginBottom: '20px',
            }}
          >
            <span style={{ color: '#6ee7b7', fontSize: '16px', fontWeight: 600 }}>
              {category}
            </span>
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            color: '#f0fdf4',
            fontSize: '52px',
            fontWeight: 800,
            lineHeight: 1.1,
            margin: '0 0 24px 0',
            maxWidth: '900px',
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle !== undefined && subtitle !== '' && (
          <p
            style={{
              color: '#a7f3d0',
              fontSize: '22px',
              margin: '0',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Domain */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '40px',
            right: '80px',
          }}
        >
          <span style={{ color: '#6ee7b7', fontSize: '18px', fontWeight: 500 }}>
            {SITE_DISPLAY_DOMAIN}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
