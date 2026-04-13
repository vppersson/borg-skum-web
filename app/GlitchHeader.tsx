'use client'

import {useState, useEffect, useRef, useId, useCallback} from 'react'
import Link from 'next/link'

// ── 9 ~11%-band med 0.5% överlapp på varje sida ──────────────────────────
const SLICE_CLIPS: readonly string[] = Array.from({length: 9}, (_, i) => {
  const top    = Math.max(0, i       * 100 / 9 - 0.5).toFixed(3)
  const bottom = Math.max(0, (8 - i) * 100 / 9 - 0.5).toFixed(3)
  return `inset(${top}% 0 ${bottom}% 0)`
})

// ── 2 50%-band för underrubriken, med 0.5% överlapp ─────────────────────
const SUB_SLICE_CLIPS = [
  'inset(0%    0 49.5% 0)',
  'inset(49.5% 0 0%    0)',
] as const

type LetterParams = {
  seed:      number
  maxOffset: number
  svgDur:    number
  variant:   'a' | 'b' | 'c'
  animDur:   number
}

type SubCharParams = {
  variant:   'a' | 'b' | 'c'
  animDur:   number
  maxOffset: number
  svgDur:    number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeLetterParams(text: string): LetterParams[] {
  const variants: Array<'a' | 'b' | 'c'> = ['a', 'b', 'c']
  return text.split('').map(() => ({
    seed:      Math.floor(Math.random() * 900),
    maxOffset: 25 + Math.floor(Math.random() * 30),
    svgDur:    500 + Math.floor(Math.random() * 450),
    variant:   variants[Math.floor(Math.random() * 3)],
    animDur:   1100 + Math.floor(Math.random() * 700),
  }))
}

function makeSubtitleParams(text: string): SubCharParams[] {
  const variants: Array<'a' | 'b' | 'c'> = ['a', 'b', 'c']
  return text.split('').map(() => ({
    variant:   variants[Math.floor(Math.random() * 3)],
    animDur:   700 + Math.floor(Math.random() * 500),
    maxOffset: 8 + Math.floor(Math.random() * 10),
    svgDur:    300 + Math.floor(Math.random() * 300),
  }))
}

function GlitchLetter({char, delay, params}: {char: string; delay: number; params: LetterParams}) {
  const rawId    = useId()
  const filterId = `bsl${rawId.replace(/:/g, '')}`
  const turbRef  = useRef<SVGFETurbulenceElement>(null)
  const dispRef  = useRef<SVGFEDisplacementMapElement>(null)
  const sliceRefs = useRef<(HTMLSpanElement | null)[]>(Array(9).fill(null))
  const [glitchKey, setGlitchKey] = useState(0)
  const [visible, setVisible]     = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!visible) return
    let raf    = 0
    let active = true
    const resetTimers: ReturnType<typeof setTimeout>[] = []
    const start     = performance.now()
    let lastSeed    = start
    let lastSlice   = start - 120
    let currentSeed = params.seed

    function tick(now: number) {
      const t = Math.min((now - start) / params.svgDur, 1)
      const turb = turbRef.current
      const disp = dispRef.current
      if (turb && disp) {
        if (now - lastSeed > 75) {
          currentSeed = (currentSeed + 17) % 999
          turb.setAttribute('seed', String(currentSeed))
          lastSeed = now
        }
        const fBase = 0.0025 + (params.seed % 12) * 0.00025
        turb.setAttribute('baseFrequency', `${fBase.toFixed(4)} ${(fBase * 4).toFixed(4)}`)
        disp.setAttribute('scale', (18 * (1 - t) * (1 - t)).toFixed(1))
      }
      const sliceInterval = 60 + t * 120
      if (now - lastSlice > sliceInterval) {
        sliceRefs.current.forEach(el => {
          if (!el || !active) return
          if (Math.random() < 0.32) {
            const sign   = Math.random() < 0.5 ? -1 : 1
            const offset = sign * (params.maxOffset * (0.4 + Math.random() * 0.6))
            el.style.transform = `translateX(${offset.toFixed(1)}px)`
            const dur = 50 + Math.random() * 90
            const rt  = setTimeout(() => { if (active && el) el.style.transform = 'translateX(0)' }, dur)
            resetTimers.push(rt)
          }
        })
        lastSlice = now
      }
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        dispRef.current?.setAttribute('scale', '0')
        sliceRefs.current.forEach(el => { if (el) el.style.transform = 'translateX(0)' })
      }
    }

    raf = requestAnimationFrame(tick)
    return () => {
      active = false
      cancelAnimationFrame(raf)
      resetTimers.forEach(clearTimeout)
      sliceRefs.current.forEach(el => { if (el) el.style.transform = 'translateX(0)' })
      dispRef.current?.setAttribute('scale', '0')
    }
  }, [visible, glitchKey, params.seed, params.maxOffset, params.svgDur])

  if (char === ' ') return <span style={{display: 'inline-block'}}>&nbsp;</span>

  if (!visible) {
    return (
      <span style={{display: 'inline-block', position: 'relative'}}>
        <span style={{display: 'inline-block', opacity: 0, userSelect: 'none'}}>{char}</span>
      </span>
    )
  }

  const durS = params.animDur / 1000

  return (
    <span
      style={{display: 'inline-block', position: 'relative'}}
      onMouseEnter={() => setGlitchKey(k => k + 1)}
    >
      <svg style={{position: 'absolute', width: 0, height: 0, overflow: 'hidden'}} aria-hidden="true">
        <defs>
          <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%" colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.003 0.012"
              numOctaves="1"
              seed={params.seed}
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <span style={{display: 'inline-block', visibility: 'hidden', userSelect: 'none'}} aria-hidden="true">
        {char}
      </span>
      <span key={glitchKey} style={{
        position: 'absolute',
        inset: 0,
        filter: `url(#${filterId})`,
        animation: `bs-letter-in-${params.variant} ${durS}s ease-out both`,
      }}>
        {SLICE_CLIPS.map((clip, si) => (
          <span
            key={si}
            ref={el => { sliceRefs.current[si] = el }}
            aria-hidden={si > 0 ? true : undefined}
            style={{display: 'inline-block', position: 'absolute', inset: 0, clipPath: clip}}
          >
            {char}
          </span>
        ))}
      </span>
      <span key={`r${glitchKey}`} aria-hidden="true" style={{
        display: 'inline-block', position: 'absolute', inset: 0,
        filter: 'sepia(1) saturate(8) hue-rotate(-15deg)',
        mixBlendMode: 'screen', pointerEvents: 'none',
        animation: `bs-glitch-red ${durS}s ease-out forwards`,
        opacity: 0,
      }}>{char}</span>
      <span key={`b${glitchKey}`} aria-hidden="true" style={{
        display: 'inline-block', position: 'absolute', inset: 0,
        filter: 'sepia(1) saturate(8) hue-rotate(185deg)',
        mixBlendMode: 'screen', pointerEvents: 'none',
        animation: `bs-glitch-blue ${durS}s ease-out forwards`,
        opacity: 0,
      }}>{char}</span>
    </span>
  )
}

function SubtitleChar({char, delay, params, noHover}: {char: string; delay: number; params: SubCharParams; noHover?: boolean}) {
  const sliceRefs = useRef<(HTMLSpanElement | null)[]>([null, null])
  const [glitchKey, setGlitchKey] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (char === ' ') { setVisible(true); return }
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay, char])

  useEffect(() => {
    if (!visible || char === ' ') return
    let raf    = 0
    let active = true
    const resetTimers: ReturnType<typeof setTimeout>[] = []
    const start    = performance.now()
    let lastSlice  = start - 80

    function tick(now: number) {
      const t = Math.min((now - start) / params.svgDur, 1)
      const sliceInterval = 50 + t * 100
      if (now - lastSlice > sliceInterval) {
        sliceRefs.current.forEach(el => {
          if (!el || !active) return
          if (Math.random() < 0.35) {
            const sign   = Math.random() < 0.5 ? -1 : 1
            const offset = sign * (params.maxOffset * (0.4 + Math.random() * 0.6))
            el.style.transform = `translateX(${offset.toFixed(1)}px)`
            const dur = 40 + Math.random() * 70
            const rt  = setTimeout(() => { if (active && el) el.style.transform = 'translateX(0)' }, dur)
            resetTimers.push(rt)
          }
        })
        lastSlice = now
      }
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        sliceRefs.current.forEach(el => { if (el) el.style.transform = 'translateX(0)' })
      }
    }

    raf = requestAnimationFrame(tick)
    return () => {
      active = false
      cancelAnimationFrame(raf)
      resetTimers.forEach(clearTimeout)
      sliceRefs.current.forEach(el => { if (el) el.style.transform = 'translateX(0)' })
    }
  }, [visible, glitchKey, char, params.maxOffset, params.svgDur])

  if (char === ' ') return <span style={{display: 'inline-block'}}>&nbsp;</span>

  if (!visible) {
    return (
      <span style={{display: 'inline-block', position: 'relative'}}>
        <span style={{display: 'inline-block', opacity: 0, userSelect: 'none'}}>{char}</span>
      </span>
    )
  }

  const durS = params.animDur / 1000

  return (
    <span
      style={{display: 'inline-block', position: 'relative'}}
      onMouseEnter={noHover ? undefined : () => setGlitchKey(k => k + 1)}
    >
      <span style={{display: 'inline-block', visibility: 'hidden', userSelect: 'none'}} aria-hidden="true">
        {char}
      </span>
      <span key={glitchKey} style={{
        position: 'absolute',
        inset: 0,
        animation: `bs-letter-in-${params.variant} ${durS}s ease-out both`,
      }}>
        {SUB_SLICE_CLIPS.map((clip, si) => (
          <span
            key={si}
            ref={el => { sliceRefs.current[si] = el }}
            aria-hidden={si > 0 ? true : undefined}
            style={{display: 'inline-block', position: 'absolute', inset: 0, clipPath: clip}}
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  )
}

const H1_STYLE: React.CSSProperties = {
  fontSize: 'clamp(4rem, 15vw, 16rem)',
  fontFamily: 'var(--font-display)',
  fontWeight: 400,
  lineHeight: 0.9,
  letterSpacing: '-0.02em',
  textTransform: 'uppercase',
  margin: '0 0 1.8rem 0',
  userSelect: 'none',
}

const PSUB: React.CSSProperties = {
  fontSize: 'clamp(1.3rem, 2.4vw, 2.1rem)',
  fontFamily: 'var(--font-serif)',
  fontWeight: 300,
  color: 'rgba(255,255,255,0.55)',
  lineHeight: 1.5,
  margin: 0,
  minHeight: '1.5em',
}

function makeSubtitleDelays(text: string): number[] {
  const chars = text.split('')
  const nonSpaceIndices = chars.reduce<number[]>((acc, c, i) => {
    if (c !== ' ') acc.push(i)
    return acc
  }, [])
  const n = nonSpaceIndices.length
  const shuffled = shuffle(nonSpaceIndices)
  const delays = new Array<number>(chars.length).fill(0)
  shuffled.forEach((charIdx, rank) => {
    delays[charIdx] = Math.round(rank * (1200 / Math.max(n - 1, 1)))
  })
  return delays
}

export function GlitchHeader({
  title,
  subtitle,
  backHref,
}: {
  title: string
  subtitle?: string
  backHref?: string
}) {
  const [active, setActive] = useState(false)
  const [linkGlitchKey, setLinkGlitchKey] = useState(0)

  const letterDelaysRef = useRef<number[] | null>(null)
  if (!letterDelaysRef.current) {
    const n     = title.length
    const order = shuffle(Array.from({length: n}, (_, i) => i))
    const delays = new Array<number>(n)
    order.forEach((letterIdx, rank) => {
      delays[letterIdx] = Math.round(rank * (2000 / Math.max(n - 1, 1)))
    })
    letterDelaysRef.current = delays
  }

  const letterParamsRef = useRef<LetterParams[] | null>(null)
  if (!letterParamsRef.current) {
    letterParamsRef.current = makeLetterParams(title)
  }

  // text för subtitle/backHref-label
  const subText = subtitle ?? (backHref ? 'Tillbaka till start' : undefined)

  const subtitleDelaysRef = useRef<number[] | null>(null)
  const subtitleParamsRef = useRef<SubCharParams[] | null>(null)
  if (subText) {
    if (!subtitleDelaysRef.current) {
      subtitleDelaysRef.current = makeSubtitleDelays(subText)
    }
    if (!subtitleParamsRef.current) {
      subtitleParamsRef.current = makeSubtitleParams(subText)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 400)
    return () => clearTimeout(t)
  }, [])

  // Alltid vid hover-in, ~50% vid hover-out
  const glitchOnEnter = useCallback(() => setLinkGlitchKey(k => k + 1), [])
  const glitchOnLeave = useCallback(() => {
    if (Math.random() < 0.5) setLinkGlitchKey(k => k + 1)
  }, [])

  const renderSubChars = (text: string, noHover?: boolean) =>
    text.split('').map((char, i) => (
      <SubtitleChar
        key={i}
        char={char}
        delay={subtitleDelaysRef.current?.[i] ?? 0}
        params={subtitleParamsRef.current?.[i] ?? {variant: 'a', animDur: 700, maxOffset: 8, svgDur: 300}}
        noHover={noHover}
      />
    ))

  return (
    <div className="bs-header">
      <h1 style={H1_STYLE} aria-label={title}>
        {active
          ? title.split('').map((char, i) => (
              <GlitchLetter
                key={i}
                char={char}
                delay={letterDelaysRef.current![i]}
                params={letterParamsRef.current![i]}
              />
            ))
          : <span style={{opacity: 0, userSelect: 'none'}} aria-hidden="true">{title}</span>
        }
      </h1>

      {subText !== undefined && !backHref && (
        <p className="bs-subtitle" style={PSUB} aria-label={subText}>
          {active
            ? renderSubChars(subText)
            : <span style={{opacity: 0, userSelect: 'none'}} aria-hidden="true">{subText}</span>
          }
        </p>
      )}

      {backHref && subText !== undefined && (
        <p className="bs-subtitle" style={{...PSUB, minHeight: '1.5em'}}>
          <Link
            href={backHref}
            aria-label={subText}
            onMouseEnter={glitchOnEnter}
            onMouseLeave={glitchOnLeave}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
              display: 'inline-block',
            }}
          >
            <span
              key={linkGlitchKey}
              style={{
                display: 'inline-block',
                animation: linkGlitchKey > 0 ? 'bs-link-glitch 0.28s ease-out both' : undefined,
              }}
            >
              {active
                ? renderSubChars(subText, true)
                : <span style={{opacity: 0, userSelect: 'none'}} aria-hidden="true">{subText}</span>
              }
            </span>
          </Link>
        </p>
      )}
    </div>
  )
}
