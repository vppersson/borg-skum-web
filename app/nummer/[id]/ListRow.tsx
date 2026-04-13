'use client'

import Link from 'next/link'
import {useState, useEffect} from 'react'

type Props = {
  href: string
  title: string
  typ: string
  author: string
  lasttid?: number
  delay: number
  variant: 'a' | 'b' | 'c'
}

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.6)',
}

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.25)',
}

function MetaCell({label, value, align = 'left'}: {label: string; value: string; align?: 'left' | 'right'}) {
  return (
    <span style={{display: 'flex', flexDirection: 'column', gap: 4, alignItems: align === 'right' ? 'flex-end' : 'flex-start'}}>
      <span style={LABEL}>{label}</span>
      <span style={MONO}>{value || '—'}</span>
    </span>
  )
}

export function ListRow({href, title, typ, author, lasttid, delay, variant}: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const durS = (0.9 + Math.random() * 0.4).toFixed(2)

  return (
    <li style={{
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      opacity: visible ? undefined : 0,
    }}>
      <Link
        href={href}
        className="bs-list-link"
        style={{
          display: 'grid',
          gridTemplateColumns: '60% 1fr',
          alignItems: 'center',
          padding: '2.2vw 0',
          textDecoration: 'none',
          color: 'inherit',
          animation: visible
            ? `bs-letter-in-${variant} ${durS}s ease-out both`
            : undefined,
        }}
      >
        <span className="bs-list-title" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.6rem, 3.5vw, 3.2rem)',
          fontWeight: 400,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          lineHeight: 1,
          color: '#f0ece5',
        }}>
          {title}
        </span>

        <span className="bs-list-meta">
          <MetaCell label="Typ" value={typ} />
          <MetaCell label="Författare" value={author} />
          <MetaCell label="Lästid" value={lasttid ? `${lasttid} min` : '—'} align="right" />
        </span>
      </Link>
    </li>
  )
}
