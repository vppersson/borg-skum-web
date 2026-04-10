import {client} from '@/lib/sanity'
import {PageContent} from './PageContent'

type Nummer = {
  _id: string
  year: number
  utgava: number
  status: string
  tryckdatum?: string
  coverImage?: {asset: {url: string}}
}

async function getNummer(): Promise<Nummer[]> {
  return client.fetch(
    `*[_type == "nummer"] | order(year desc, utgava desc) {
      _id, year, utgava, status, tryckdatum,
      coverImage { asset -> { url } }
    }`,
  )
}

export default async function Page() {
  const nummer = await getNummer()
  return <PageContent nummer={nummer} />
}
