'use client'

import Link from 'next/link'
import {useState, useCallback, useRef, useId, useEffect} from 'react'

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

const IMG_LAYER: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

type GC = {
  baseFilter?: string
  baseAnim?:   string
  redAnim?:    string
  blueAnim?:   string
  saAnim?:     string
  sbAnim?:     string
}

const GC_IDLE: GC = {baseFilter: 'grayscale(1)'}

const BURSTS = [
  {c: 0.05, hw: 0.035, pk: 14},
  {c: 0.29, hw: 0.04,  pk: 11},
  {c: 0.58, hw: 0.05,  pk: 16},
]

function burstScale(t: number): number {
  let s = 0
  for (const b of BURSTS) {
    const d = Math.abs(t - b.c)
    if (d < b.hw) {
      const p = 1 - d / b.hw
      s = Math.max(s, p * p * b.pk)
    }
  }
  return s
}

export function NummCard({id, year, utgava, status, dotColor, imageUrl, tryckdatum}: Props) {
  const [pos, setPos]       = useState({x: -200, y: -200})
  const [phase, setPhase]   = useState<'hidden' | 'in' | 'out'>('hidden')
  const [enterKey, setEnterKey] = useState(0)
  const phaseRef  = useRef<'hidden' | 'in' | 'out'>('hidden')
  const hoverId   = useRef(0)
  const [gc, setGc]         = useState<GC>(GC_IDLE)
  const wasColorized        = useRef(false)  // true after reveal animation completes

  // SVG turbulence — unique filter ID per card instance
  const rawId    = useId()
  const filterId = `bsd${rawId.replace(/:/g, '_')}`
  const turbRef  = useRef<SVGFETurbulenceElement>(null)
  const dispRef  = useRef<SVGFEDisplacementMapElement>(null)
  const animRaf  = useRef<number | null>(null)
  const outroTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (animRaf.current !== null) cancelAnimationFrame(animRaf.current)
    if (outroTimer.current !== null) clearTimeout(outroTimer.current)
  }, [])

  // ── Turbulence helpers ──────────────────────────────────────────────────
  const resetTurbDom = useCallback(() => {
    turbRef.current?.setAttribute('baseFrequency', '0 0')
    dispRef.current?.setAttribute('scale', '0')
  }, [])

  const runTurb = useCallback((looping: boolean, thisHover: number) => {
    if (animRaf.current !== null) cancelAnimationFrame(animRaf.current)
    const duration = looping ? 3000 : 1600
    const t0 = performance.now()

    function frame(now: number) {
      if (hoverId.current !== thisHover) { resetTurbDom(); animRaf.current = null; return }
      const tRaw = (now - t0) / duration
      const t    = looping ? tRaw % 1 : Math.min(tRaw, 1)
      const scale = burstScale(t)
      const f    = 0.012 + scale * 0.0025
      const seed = scale > 1.5 ? Math.floor(now / 50) % 35 : 0
      turbRef.current?.setAttribute('baseFrequency', `${f.toFixed(4)} ${(f * 14).toFixed(4)}`)
      turbRef.current?.setAttribute('seed', String(seed))
      dispRef.current?.setAttribute('scale', scale.toFixed(2))
      if (looping || tRaw < 1) { animRaf.current = requestAnimationFrame(frame) }
      else { resetTurbDom(); animRaf.current = null }
    }
    animRaf.current = requestAnimationFrame(frame)
  }, [resetTurbDom])

  // Short outro turbulence burst that fades out over ~450 ms
  const runTurbOutro = useCallback((thisHover: number) => {
    if (animRaf.current !== null) cancelAnimationFrame(animRaf.current)
    const duration = 450
    const t0 = performance.now()

    function frame(now: number) {
      if (hoverId.current !== thisHover) { resetTurbDom(); animRaf.current = null; return }
      const t = Math.min((now - t0) / duration, 1)
      // Single burst peaking at t≈0.12, soft quadratic envelope
      const d = Math.abs(t - 0.12)
      const p = Math.max(0, 1 - d / 0.14)
      const scale = p * p * 12
      const f    = 0.012 + scale * 0.002
      const seed = scale > 1 ? Math.floor(now / 50) % 20 : 0
      turbRef.current?.setAttribute('baseFrequency', `${f.toFixed(4)} ${(f * 14).toFixed(4)}`)
      turbRef.current?.setAttribute('seed', String(seed))
      dispRef.current?.setAttribute('scale', scale.toFixed(2))
      if (t < 1) { animRaf.current = requestAnimationFrame(frame) }
      else { resetTurbDom(); animRaf.current = null }
    }
    animRaf.current = requestAnimationFrame(frame)
  }, [resetTurbDom])

  // ── Phase helpers ───────────────────────────────────────────────────────
  const setPhaseSync = (p: 'hidden' | 'in' | 'out') => {
    phaseRef.current = p
    setPhase(p)
  }

  // ── Event handlers ──────────────────────────────────────────────────────
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (outroTimer.current !== null) { clearTimeout(outroTimer.current); outroTimer.current = null }
    setPos({x: e.clientX, y: e.clientY})
    setEnterKey(k => k + 1)
    setPhaseSync('in')
    wasColorized.current = false
    const thisHover = ++hoverId.current
    runTurb(status === 'pagaende', thisHover)

    if (status === 'utgiven') {
      setGc({baseFilter: 'grayscale(1)', baseAnim: 'none', redAnim: 'none', blueAnim: 'none', saAnim: 'none', sbAnim: 'none'})
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (hoverId.current !== thisHover) return
        setGc({
          baseAnim: 'bs-glitch-r-base 1.6s ease-out forwards',
          redAnim:  'bs-glitch-red    1.6s ease-out forwards',
          blueAnim: 'bs-glitch-blue   1.6s ease-out forwards',
          saAnim:   'bs-glitch-sa     1.6s ease-out forwards',
          sbAnim:   'bs-glitch-sb     1.6s ease-out forwards',
        })
      }))
    } else if (status === 'pagaende') {
      setGc({
        baseAnim: 'bs-glitch-l-base 3s linear infinite',
        redAnim:  'bs-glitch-red    3s linear infinite',
        blueAnim: 'bs-glitch-blue   3s linear infinite',
        saAnim:   'bs-glitch-sa     3s linear infinite',
        sbAnim:   'bs-glitch-sb     3s linear infinite',
      })
    }
  }, [status, runTurb])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPos({x: e.clientX, y: e.clientY})
  }, [])

  const handleMouseLeave = useCallback(() => {
    const outroHover = ++hoverId.current   // new ID for outro RAF; also cancels double-RAF
    setPhaseSync('out')

    const wasCo = wasColorized.current
    wasColorized.current = false

    // Pick base outro animation based on what state the image was in
    const baseAnim = wasCo
      ? 'bs-glitch-outro-c 0.45s ease-out forwards'
      : status === 'pagaende'
        ? 'bs-glitch-outro-g 0.35s ease-out forwards'
        : undefined

    setGc({
      ...(baseAnim ? {baseAnim} : {baseFilter: 'grayscale(1)'}),
      redAnim:  'bs-glitch-outro-ov 0.45s ease-out forwards',
      blueAnim: 'bs-glitch-outro-ov 0.45s ease-out forwards',
      saAnim:   'bs-glitch-outro-ov 0.45s ease-out forwards',
      sbAnim:   'bs-glitch-outro-ov 0.45s ease-out forwards',
    })

    runTurbOutro(outroHover)

    // After outro completes, settle to fully idle state
    const delay = wasCo ? 480 : 380
    outroTimer.current = setTimeout(() => {
      if (hoverId.current === outroHover) setGc(GC_IDLE)
      outroTimer.current = null
    }, delay)
  }, [status, runTurbOutro])

  const handleCursorAnimEnd = useCallback(() => {
    if (phaseRef.current === 'out') setPhaseSync('hidden')
  }, [])

  // Reveal animation ends — hold image in color
  const handleBaseAnimEnd = useCallback(() => {
    if (status === 'utgiven') {
      wasColorized.current = true
      setGc({baseFilter: 'grayscale(0)'})
    }
  }, [status])

  const sliceFilter = status === 'pagaende' ? 'grayscale(1)' : undefined

  return (
    <>
      {phase !== 'hidden' && (
        <div
          key={enterKey}
          onAnimationEnd={handleCursorAnimEnd}
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
          <span style={{animation: phase === 'in' ? 'bs-cursor-text 0.18s ease-out 0.32s both' : undefined}}>
            {status === 'utgiven' ? 'Explore' : 'Edit'}
          </span>
        </div>
      )}

      <Link
        href={`/nummer/${id}`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{display: 'block', textDecoration: 'none', cursor: phase === 'in' ? 'none' : 'pointer'}}
      >
        {/* Container: clips overflow, NO transform here */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3 / 2',
            overflow: 'hidden',
            borderRadius: '2px',
            background: '#141413',
          }}
        >
          {/* SVG filter definition — hidden, referenced by filter wrapper below */}
          <svg style={{position: 'absolute', width: 0, height: 0, overflow: 'hidden'}} aria-hidden="true">
            <defs>
              <filter id={filterId} x="-10%" y="-5%" width="120%" height="110%" colorInterpolationFilters="sRGB">
                <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0 0" numOctaves="1" seed="0" result="noise"/>
                <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
              </filter>
            </defs>
          </svg>

          {imageUrl && (
            /* Scale lives here — inside overflow:hidden — so zoom stays within card bounds */
            <div
              style={{
                position: 'absolute',
                inset: 0,
                filter: `url(#${filterId})`,
                transform: phase === 'in' ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              {/* Layer 1 — base */}
              <img
                src={imageUrl}
                alt={`BS ${year}:${utgava}`}
                style={{...IMG_LAYER, filter: gc.baseFilter || undefined, animation: gc.baseAnim}}
                onAnimationEnd={handleBaseAnimEnd}
              />
              {/* Layer 2 — röd kanal */}
              <img src={imageUrl} alt="" aria-hidden="true" style={{
                ...IMG_LAYER,
                filter: 'sepia(1) saturate(8) hue-rotate(-15deg)',
                mixBlendMode: 'screen',
                opacity: 0,
                animation: gc.redAnim,
              }}/>
              {/* Layer 3 — blå kanal */}
              <img src={imageUrl} alt="" aria-hidden="true" style={{
                ...IMG_LAYER,
                filter: 'sepia(1) saturate(8) hue-rotate(185deg)',
                mixBlendMode: 'screen',
                opacity: 0,
                animation: gc.blueAnim,
              }}/>
              {/* Layer 4 — slice A (övre ~32%) */}
              <img src={imageUrl} alt="" aria-hidden="true" style={{
                ...IMG_LAYER,
                filter: sliceFilter,
                clipPath: 'inset(0 0 68% 0)',
                opacity: 0,
                animation: gc.saAnim,
              }}/>
              {/* Layer 5 — slice B (mitten-nedre ~28%) */}
              <img src={imageUrl} alt="" aria-hidden="true" style={{
                ...IMG_LAYER,
                filter: sliceFilter,
                clipPath: 'inset(52% 0 20% 0)',
                opacity: 0,
                animation: gc.sbAnim,
              }}/>
            </div>
          )}
        </div>

        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
            <span style={{fontSize: 15, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f0ece5'}}>
              BS {year}:{utgava}
            </span>
            {tryckdatum && (
              <span style={{fontSize: 15, fontFamily: 'var(--font-serif)', fontWeight: 300, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.4)'}}>
                {relativeTime(tryckdatum)}
              </span>
            )}
          </div>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center',
              height: phase === 'in' ? 20 : 10,
              minWidth: phase === 'in' ? 0 : 10,
              borderRadius: 999, background: dotColor, flexShrink: 0,
              transition: 'height 0.6s cubic-bezier(0.34, 1.3, 0.64, 1), min-width 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)',
            }}
          >
            <span style={{display: 'grid', gridTemplateColumns: phase === 'in' ? '1fr' : '0fr', transition: 'grid-template-columns 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)'}}>
              <span style={{overflow: 'hidden'}}>
                <span style={{
                  display: 'block', padding: '0 11px', fontSize: 9,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#090908', whiteSpace: 'nowrap',
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
