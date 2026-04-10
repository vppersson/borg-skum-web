'use client'

import Link from 'next/link'
import {useState, useCallback, useRef} from 'react'

type Props = {
  id: string
  year: number
  utgava: number
  status: string
  dotColor: string
  imageUrl?: string
  tryckdatum?: string
}

const STATUS_LABEL: Record<string, string> = {
  utgiven: 'Utgiven',
  pagaende: 'Pågående',
}

function relativeTime(dateStr: string): string {
  const rtf = new Intl.RelativeTimeFormat('sv', {numeric: 'auto'})
  const days = Math.round((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
  const abs = Math.abs(days)
  if (abs < 7) return rtf.format(days, 'day')
  if (abs < 30) return rtf.format(Math.round(days / 7), 'week')
  if (abs < 365) return rtf.format(Math.round(days / 30), 'month')
  return rtf.format(Math.round(days / 365), 'year')
}

export function NummCard({id, year, utgava, status, dotColor, imageUrl, tryckdatum}: Props) {
  const [pos, setPos] = useState({x: -200, y: -200})
  const [phase, setPhase] = useState<'hidden' | 'in' | 'out'>('hidden')
  const [enterKey, setEnterKey] = useState(0)
  const phaseRef = useRef<'hidden' | 'in' | 'out'>('hidden')

  const setPhaseSync = (p: 'hidden' | 'in' | 'out') => {
    phaseRef.current = p
    setPhase(p)
  }

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setPos({x: e.clientX, y: e.clientY})
    setEnterKey((k) => k + 1)
setPhaseSync('in')
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPos({x: e.clientX, y: e.clientY})
  }, [])

  const handleMouseLeave = useCallback(() => {
    setPhaseSync('out')
  }, [])

  const handleAnimationEnd = useCallback(() => {
    if (phaseRef.current === 'out') setPhaseSync('hidden')
  }, [])

  return (
    <>
      {phase !== 'hidden' && (
        <div
          key={enterKey}
          onAnimationEnd={handleAnimationEnd}
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: status === 'utgiven' ? 'rgba(185, 28, 28, 0.90)' : 'rgba(55, 55, 55, 0.90)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            zIndex: 9999,
            userSelect: 'none',
            animation:
              phase === 'in'
                ? 'bs-cursor-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                : 'bs-cursor-out 0.22s ease-in forwards',
          }}
        >
          <span
            style={{
              animation:
                phase === 'in' ? 'bs-cursor-text 0.18s ease-out 0.32s both' : undefined,
            }}
          >
            {status === 'utgiven' ? 'Explore' : 'Edit'}
          </span>
        </div>
      )}
      <Link
        href={`/nummer/${id}`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'block',
          textDecoration: 'none',
          cursor: phase === 'in' ? 'none' : 'pointer',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3 / 2',
            overflow: 'hidden',
            borderRadius: '2px',
            background: '#e5e5e5',
          }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt={`BS ${year}:${utgava}`}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: status === 'pagaende' ? 'grayscale(100%)' : 'none',
                transform: phase === 'in' ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
          }}
        >
          <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
            <span
              style={{
                fontSize: 15,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#171717',
              }}
            >
              BS {year}:{utgava}
            </span>
            {tryckdatum && (
              <span
                style={{
                  fontSize: 15,
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 300,
                  letterSpacing: '0.02em',
                  color: '#9ca3af',
                }}
              >
                {relativeTime(tryckdatum)}
              </span>
            )}
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: phase === 'in' ? 20 : 10,
              minWidth: phase === 'in' ? 0 : 10,
              borderRadius: 999,
              background: dotColor,
              flexShrink: 0,
              transition: 'height 0.6s cubic-bezier(0.34, 1.3, 0.64, 1), min-width 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)',
            }}
          >
            <span style={{
              display: 'grid',
              gridTemplateColumns: phase === 'in' ? '1fr' : '0fr',
              transition: 'grid-template-columns 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)',
            }}>
              <span style={{overflow: 'hidden'}}>
                <span style={{
                  display: 'block',
                  padding: '0 11px',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  opacity: phase === 'in' ? undefined : 0,
                  animation: phase === 'in' ? 'bs-cursor-text 0.18s ease-out 0.44s both' : undefined,
                }}>
                  {STATUS_LABEL[status] ?? status}
                </span>
              </span>
            </span>
          </span>
        </div>
      </Link>
    </>
  )
}
