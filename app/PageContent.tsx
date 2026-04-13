'use client'

import {useState, useEffect} from 'react'
import {NummCard} from './NummCard'
import {GlitchHeader} from './GlitchHeader'

const SUBTITLE =
  'En tidning av Stockholms amfibieregementes kamratförening Vapenbröderna'

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

type Phase = 'idle' | 'cards'

export function PageContent({nummer}: {nummer: Nummer[]}) {
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    const timer = setTimeout(() => setPhase('cards'), 600)
    return () => clearTimeout(timer)
  }, [])

  const cardsVisible = phase === 'cards'

  return (
    <div className="bs-page">
      <GlitchHeader title={TITLE_TEXT} subtitle={SUBTITLE} />

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
