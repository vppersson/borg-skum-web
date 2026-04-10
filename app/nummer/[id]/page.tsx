import {client} from '@/lib/sanity'
import Link from 'next/link'
import {notFound} from 'next/navigation'

type Innehall = {
  _id: string
  title: string
  slug: {current: string}
  contentType: string
  storlek?: string
  status: string
  author?: {firstName: string; lastName: string}
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
      author -> { firstName, lastName }
    }`,
    {nummerId},
  )
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

const statusLabel: Record<string, string> = {
  ide: 'Idé',
  tilldelas: 'Tilldelas',
  skrivs: 'Skrivs',
  inlamnat: 'Inlämnat',
  redigeras: 'Redigeras',
  korrektur: 'Korrekturläses',
  granskning: 'Klar för granskning',
  klart: 'Klart',
}

const statusColor: Record<string, string> = {
  ide: 'bg-gray-100 text-gray-600',
  tilldelas: 'bg-yellow-100 text-yellow-700',
  skrivs: 'bg-blue-100 text-blue-700',
  inlamnat: 'bg-purple-100 text-purple-700',
  redigeras: 'bg-orange-100 text-orange-700',
  korrektur: 'bg-pink-100 text-pink-700',
  granskning: 'bg-indigo-100 text-indigo-700',
  klart: 'bg-green-100 text-green-700',
}

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const [nummer, innehall] = await Promise.all([getNummer(id), getInnehall(id)])

  if (!nummer) notFound()

  return (
    <div style={{maxWidth: '800px', margin: '0 auto', padding: '40px 24px'}}>
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">
        ← Alla nummer
      </Link>
      <h1 className="text-2xl font-bold mb-1">
        BS {nummer.year}:{nummer.utgava}
      </h1>
      {nummer.tema && <p className="text-gray-500 mb-6">{nummer.tema}</p>}

      <h2 className="text-lg font-semibold mb-3 mt-8">Innehåll</h2>
      {innehall.length === 0 && (
        <p className="text-gray-500">Inget innehåll tillagt ännu.</p>
      )}
      <ul className="space-y-2">
        {innehall.map((c) => (
          <li key={c._id}>
            <Link
              href={`/innehall/${c.slug.current}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {contentTypeLabel[c.contentType] ?? c.contentType}
                  {c.storlek && ` · ${c.storlek.toUpperCase()}`}
                  {c.author && ` · ${c.author.firstName} ${c.author.lastName}`}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ml-4 ${statusColor[c.status] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {statusLabel[c.status] ?? c.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
