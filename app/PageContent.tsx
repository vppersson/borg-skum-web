import {NummCard} from './NummCard'
import {TitleWave} from './TitleWave'

const SUBTITLE =
  'Stockholms amfibieregementes kamratförening Vapenbrödernas medlemstidning'

type Nummer = {
  _id: string
  year: number
  utgava: number
  status: string
  tryckdatum?: string
  coverImage?: {asset: {url: string}}
}

function getDotColor(s: string) {
  if (s === 'utgiven') return '#16a34a'
  if (s === 'pagaende') return '#b91c1c'
  return '#d1d5db'
}

const H1: React.CSSProperties = {
  fontSize: 'clamp(4rem, 15vw, 16rem)',
  fontFamily: 'var(--font-display)',
  fontWeight: 400,
  lineHeight: 0.9,
  letterSpacing: '-0.02em',
  textTransform: 'uppercase',
  margin: '0 0 1.8rem 0',
}

const PSUB: React.CSSProperties = {
  fontSize: 'clamp(1.3rem, 2.4vw, 2.1rem)',
  fontFamily: 'var(--font-serif)',
  fontWeight: 300,
  color: '#6b7280',
  lineHeight: 1.5,
  margin: 0,
}

export function PageContent({nummer}: {nummer: Nummer[]}) {
  return (
    <div className="bs-page">
      <div className="bs-header">
        <h1 style={H1}>
          <TitleWave text="Borg Skum" />
        </h1>
        <p className="bs-subtitle" style={PSUB}>
          {SUBTITLE}
        </p>
      </div>

      {nummer.length === 0 && (
        <p style={{color: '#9ca3af', textAlign: 'center'}}>Inga nummer finns ännu.</p>
      )}

      <div className="bs-grid">
        {nummer.map((n) => (
          <NummCard
            key={n._id}
            id={n._id}
            year={n.year}
            utgava={n.utgava}
            status={n.status}
            dotColor={getDotColor(n.status)}
            imageUrl={n.coverImage?.asset?.url}
            tryckdatum={n.tryckdatum}
          />
        ))}
      </div>
    </div>
  )
}
