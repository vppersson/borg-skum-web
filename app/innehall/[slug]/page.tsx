import {client} from '@/lib/sanity'
import {notFound} from 'next/navigation'
import Link from 'next/link'
import {UploadDokumentForm, UploadBilderForm} from './UploadForm'

type Innehall = {
  _id: string
  title: string
  beskrivning?: string
  contentType: string
  storlek?: string
  status: string
  author?: {firstName: string; lastName: string}
  nummer: {_id: string; year: number; utgava: number}
  document?: {asset: {url: string; originalFilename: string}}
  images?: {_key: string; asset: {url: string}; caption?: string}[]
}

async function getInnehall(slug: string): Promise<Innehall | null> {
  return client.fetch(
    `*[_type == "innehall" && slug.current == $slug][0] {
      _id, title, beskrivning, contentType, storlek, status,
      author -> { firstName, lastName },
      nummer -> { _id, year, utgava },
      document { asset -> { url, originalFilename } },
      images[] { _key, asset -> { url }, caption }
    }`,
    {slug},
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

export default async function Page({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const innehall = await getInnehall(slug)

  if (!innehall) notFound()

  const {nummer} = innehall

  return (
    <div style={{maxWidth: '800px', margin: '0 auto', padding: '40px 24px'}}>
      <Link
        href={`/nummer/${nummer._id}`}
        className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block"
      >
        ← BS {nummer.year}:{nummer.utgava}
      </Link>

      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">
          {contentTypeLabel[innehall.contentType] ?? innehall.contentType}
          {innehall.storlek && ` · ${innehall.storlek.toUpperCase()}`}
        </span>
        <span className="text-sm text-gray-400">·</span>
        <span className="text-sm text-gray-500">{statusLabel[innehall.status] ?? innehall.status}</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">{innehall.title}</h1>

      {innehall.author && (
        <p className="text-gray-500 mb-4">
          {innehall.author.firstName} {innehall.author.lastName}
        </p>
      )}

      {innehall.beskrivning && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Redaktionell inriktning</p>
          {innehall.beskrivning}
        </div>
      )}

      <div className="space-y-4 mb-10">
        <UploadDokumentForm
          innehallId={innehall._id}
          hasDokument={!!innehall.document?.asset?.url}
        />
        <UploadBilderForm innehallId={innehall._id} />
      </div>

      {innehall.document?.asset?.url && (
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-2">Uppladdat dokument</h2>
          <a
            href={innehall.document.asset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {innehall.document.asset.originalFilename ?? 'Öppna dokument'}
          </a>
        </div>
      )}

      {innehall.images && innehall.images.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Uppladdade bilder</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {innehall.images.map((img) => (
              <div key={img._key} className="space-y-1">
                <img
                  src={img.asset.url}
                  alt={img.caption ?? ''}
                  className="w-full aspect-square object-cover rounded"
                />
                {img.caption && <p className="text-xs text-gray-500">{img.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
