'use client'

import {useState, useEffect, useRef, useId} from 'react'
import {NummCard} from './NummCard'

const SUBTITLE =
  'Stockholms amfibieregementes kamratförening Vapenbrödernas medlemstidning'

const TITLE_TEXT = 'Borg Skum'

type Nummer = {
  _id: string
  year: number
  utgava: number
  status: string
  tryckdatum?: string
  coverImage?: {asset: {url: string}}
}

function getDotColor(_s: string) { return '#f0ece5' }

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── 9 ~11%-band med 0.5% överlapp på varje sida ──────────────────────────
// Överlappet eliminerar de subpixelglapp webbläsaren annars lämnar vid bandgränser.
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

// ── Per-bokstavs parametrar för titeln ────────────────────────────────────
type LetterParams = {
  seed:      number
  maxOffset: number
  svgDur:    number
  variant:   'a' | 'b' | 'c'
  animDur:   number
}

function makeLetterParams(): LetterParams[] {
  const variants: Array<'a' | 'b' | 'c'> = ['a', 'b', 'c']
  return TITLE_TEXT.split('').map(() => ({
    seed:      Math.floor(Math.random() * 900),
    maxOffset: 25 + Math.floor(Math.random() * 30),
    svgDur:    500 + Math.floor(Math.random() * 450),
    variant:   variants[Math.floor(Math.random() * 3)],
    animDur:   1100 + Math.floor(Math.random() * 700),
  }))
}

// ── Per-tecken-parametrar för underrubriken ───────────────────────────────
type SubCharParams = {
  variant:   'a' | 'b' | 'c'
  animDur:   number
  maxOffset: number
  svgDur:    number
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

// ── En titel-bokstav ──────────────────────────────────────────────────────
// Skivorna ÄR bokstaven — ingen synlig basbokstav som orsakar overlay-känsla.
// CSS-animation + SVG-filter på wrapper. RAF-loop translateX:ar skivor (ej opacity).
function GlitchLetter({
  char, delay, params,
}: {
  char: string
  delay: number
  params: LetterParams
}) {
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

      // SVG-turbulens
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

      // Skiv-förskjutning: translateX istället för opacity — ger riktig displacement
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

      {/* Osynlig spacer — ger layoutbredd/höjd */}
      <span style={{display: 'inline-block', visibility: 'hidden', userSelect: 'none'}} aria-hidden="true">
        {char}
      </span>

      {/* key=glitchKey tvingar remount → CSS-animation startar om */}
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
            style={{
              display: 'inline-block',
              position: 'absolute',
              inset: 0,
              clipPath: clip,
            }}
          >
            {char}
          </span>
        ))}
      </span>

      {/* Röd kanal */}
      <span key={`r${glitchKey}`} aria-hidden="true" style={{
        display: 'inline-block', position: 'absolute', inset: 0,
        filter: `sepia(1) saturate(8) hue-rotate(-15deg)`,
        mixBlendMode: 'screen', pointerEvents: 'none',
        animation: `bs-glitch-red ${durS}s ease-out forwards`,
        opacity: 0,
      }}>{char}</span>

      {/* Blå kanal */}
      <span key={`b${glitchKey}`} aria-hidden="true" style={{
        display: 'inline-block', position: 'absolute', inset: 0,
        filter: `sepia(1) saturate(8) hue-rotate(185deg)`,
        mixBlendMode: 'screen', pointerEvents: 'none',
        animation: `bs-glitch-blue ${durS}s ease-out forwards`,
        opacity: 0,
      }}>{char}</span>
    </span>
  )
}

// ── En underrubrik-bokstav: samma princip, 4 skivor, ingen SVG-filter ─────
function SubtitleChar({
  char, delay, params,
}: {
  char: string
  delay: number
  params: SubCharParams
}) {
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
      onMouseEnter={() => setGlitchKey(k => k + 1)}
    >
      {/* Osynlig spacer */}
      <span style={{display: 'inline-block', visibility: 'hidden', userSelect: 'none'}} aria-hidden="true">
        {char}
      </span>

      {/* key=glitchKey tvingar remount → CSS-animation startar om */}
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
            style={{
              display: 'inline-block',
              position: 'absolute',
              inset: 0,
              clipPath: clip,
            }}
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  )
}

type Phase = 'idle' | 'cards'

export function PageContent({nummer}: {nummer: Nummer[]}) {
  const [phase, setPhase]             = useState<Phase>('idle')
  const [titleActive, setTitleActive] = useState(false)

  const letterDelaysRef = useRef<number[] | null>(null)
  if (!letterDelaysRef.current) {
    const n     = TITLE_TEXT.length
    const order = shuffle(Array.from({length: n}, (_, i) => i))
    const delays = new Array<number>(n)
    order.forEach((letterIdx, rank) => {
      delays[letterIdx] = Math.round(rank * (2000 / (n - 1)))
    })
    letterDelaysRef.current = delays
  }

  const letterParamsRef = useRef<LetterParams[] | null>(null)
  if (!letterParamsRef.current) {
    letterParamsRef.current = makeLetterParams()
  }

  const subtitleDelaysRef = useRef<number[] | null>(null)
  if (!subtitleDelaysRef.current) {
    const chars = SUBTITLE.split('')
    const nonSpaceIndices = chars.reduce<number[]>((acc, c, i) => {
      if (c !== ' ') acc.push(i)
      return acc
    }, [])
    const n = nonSpaceIndices.length
    const shuffled = shuffle(nonSpaceIndices)
    const delays = new Array<number>(chars.length).fill(0)
    shuffled.forEach((charIdx, rank) => {
      delays[charIdx] = Math.round(rank * (1200 / (n - 1)))
    })
    subtitleDelaysRef.current = delays
  }

  const subtitleParamsRef = useRef<SubCharParams[] | null>(null)
  if (!subtitleParamsRef.current) {
    subtitleParamsRef.current = makeSubtitleParams(SUBTITLE)
  }

  useEffect(() => {
    const t = setTimeout(() => setTitleActive(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!titleActive) return
    const timer = setTimeout(() => setPhase('cards'), 200)
    return () => clearTimeout(timer)
  }, [titleActive])

  const cardsVisible = phase === 'cards'

  return (
    <div className="bs-page">
      <div className="bs-header">
        <h1 style={H1_STYLE} aria-label={TITLE_TEXT}>
          {titleActive
            ? TITLE_TEXT.split('').map((char, i) => (
                <GlitchLetter
                  key={i}
                  char={char}
                  delay={letterDelaysRef.current![i]}
                  params={letterParamsRef.current![i]}
                />
              ))
            : <span style={{opacity: 0, userSelect: 'none'}} aria-hidden="true">{TITLE_TEXT}</span>
          }
        </h1>

        <p className="bs-subtitle" style={PSUB} aria-label={SUBTITLE}>
          {titleActive
            ? SUBTITLE.split('').map((char, i) => (
                <SubtitleChar
                  key={i}
                  char={char}
                  delay={subtitleDelaysRef.current![i]}
                  params={subtitleParamsRef.current![i]}
                />
              ))
            : <span style={{opacity: 0, userSelect: 'none'}} aria-hidden="true">{SUBTITLE}</span>
          }
        </p>
      </div>

      {nummer.length === 0 && (
        <p style={{color: 'rgba(255,255,255,0.45)', textAlign: 'center'}}>Inga nummer finns ännu.</p>
      )}

      <div className="bs-grid">
        {nummer.map((n, i) => (
          <div
            key={n._id}
            style={{
              opacity: cardsVisible ? 1 : 0,
              transition: `opacity 0s ${i * 120}ms`,
            }}
          >
            <NummCard
              id={n._id}
              year={n.year}
              utgava={n.utgava}
              status={n.status}
              dotColor={getDotColor(n.status)}
              imageUrl={n.coverImage?.asset?.url}
              tryckdatum={n.tryckdatum}
              landDelay={cardsVisible ? i * 120 : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
