import {client} from '@/lib/sanity'
import {notFound} from 'next/navigation'
import {GlitchHeader} from '@/app/GlitchHeader'
import {ListRow} from './ListRow'

type Innehall = {
  _id: string
  title: string
  slug: {current: string}
  contentType: string
  storlek?: string
  status: string
  body?: {_type: string; children?: {text?: string}[]}[]
  author?: {firstName: string; lastName: string}
}

function calcLasttid(body?: Innehall['body']): number | undefined {
  if (!body?.length) return undefined
  const words = body
    .filter(b => b._type === 'block')
    .flatMap(b => b.children ?? [])
    .map(c => c.text ?? '')
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return words > 0 ? Math.max(1, Math.round(words / 200)) : undefined
}

const contentTypeLabel: Record<string, string> = {
  artikel: 'Artikel',
  kronika: 'Krönika',
  reportage: 'Reportage',
  notis: 'Notis',
  recension: 'Recension',
  insandare: 'Insändare',
  ovrigt: 'Övrigt',
}

type Nummer = {
  _id: string
  year: number
  utgava: number
  tema?: string
  status: string
  presstop?: string
  tryckdatum?: string
}

async function getNummer(id: string): Promise<Nummer | null> {
  return client.fetch(
    `*[_type == "nummer" && _id == $id][0] {
      _id, year, utgava, tema, status, presstop, tryckdatum
    }`,
    {id},
  )
}

async function getInnehall(nummerId: string): Promise<Innehall[]> {
  return client.fetch(
    `*[_type == "innehall" && nummer._ref == $nummerId] | order(contentType asc, title asc) {
      _id, title, slug, contentType, storlek, status,
      body[] { _type, children[] { text } },
      author -> { firstName, lastName }
    }`,
    {nummerId},
  )
}


export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const [nummer, innehall] = await Promise.all([getNummer(id), getInnehall(id)])

  if (!nummer) notFound()

  const title = `BS ${nummer.year}:${nummer.utgava}`

  return (
    <div className="bs-page">
      <GlitchHeader title={title} backHref="/" />

      <div style={{marginTop: '5vw'}}>

        {innehall.length === 0 && (
          <p style={{color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.06em'}}>
            Inget innehåll tillagt ännu.
          </p>
        )}

        {innehall.length > 0 && (
          <div style={{borderBottom: '1px solid rgba(255,255,255,0.15)', animation: 'bs-letter-in-a 0.9s ease-out 1000ms both'}} />
        )}

        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
          {innehall.map((c, i) => {
            const variants = ['a', 'b', 'c'] as const
            return (
              <ListRow
                key={c._id}
                href={`/innehall/${c.slug.current}`}
                title={c.title}
                typ={contentTypeLabel[c.contentType] ?? c.contentType}
                author={c.author ? `${c.author.firstName} ${c.author.lastName}` : ''}
                lasttid={calcLasttid(c.body)}
                delay={1000 + i * 120}
                variant={variants[i % 3]}
              />
            )
          })}
        </ul>
      </div>
    </div>
  )
}
