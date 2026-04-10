'use server'

import {writeClient} from '@/lib/sanity'
import mammoth from 'mammoth'
import {randomKey} from '@portabletext/block-tools'
import {parse, HTMLElement as NHTMLElement} from 'node-html-parser'

type DokumentState = {error?: string; success?: boolean; bodyExtracted?: boolean}
type BilderState = {error?: string; success?: boolean; count?: number}

type PortableTextSpan = {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

type PortableTextBlock = {
  _type: 'block'
  _key: string
  style: string
  children: PortableTextSpan[]
  markDefs: []
}

function parseInline(el: NHTMLElement, inheritedMarks: string[] = []): PortableTextSpan[] {
  const spans: PortableTextSpan[] = []
  for (const node of el.childNodes) {
    if (node.nodeType === 3) {
      const text = node.text ?? ''
      if (text.trim()) spans.push({_type: 'span', _key: randomKey(12), text, marks: inheritedMarks})
    } else if (node instanceof NHTMLElement) {
      const tag = node.tagName?.toLowerCase()
      const extraMarks: string[] = []
      if (tag === 'strong' || tag === 'b') extraMarks.push('strong')
      if (tag === 'em' || tag === 'i') extraMarks.push('em')
      spans.push(...parseInline(node, [...inheritedMarks, ...extraMarks]))
    }
  }
  return spans
}

async function docxToBlocks(buffer: Buffer): Promise<PortableTextBlock[]> {
  const {value: html} = await mammoth.convertToHtml({buffer})
  const root = parse(html)
  const blocks: PortableTextBlock[] = []

  for (const el of root.childNodes) {
    if (!(el instanceof NHTMLElement)) continue
    const tag = el.tagName?.toLowerCase()
    let style: string
    if (tag === 'h1') style = 'h2'
    else if (tag === 'h2') style = 'h2'
    else if (tag === 'h3') style = 'h3'
    else if (tag === 'h4') style = 'h4'
    else if (tag === 'p') style = 'normal'
    else if (tag === 'blockquote') style = 'blockquote'
    else continue

    const children = parseInline(el)
    if (children.length === 0) continue

    blocks.push({_type: 'block', _key: randomKey(12), style, children, markDefs: []})
  }

  return blocks
}

export async function uploadDokument(
  innehallId: string,
  _prevState: DokumentState,
  formData: FormData,
): Promise<DokumentState> {
  const file = formData.get('dokument') as File | null
  if (!file || file.size === 0) return {error: 'Ingen fil vald.'}

  const buffer = Buffer.from(await file.arrayBuffer())
  const isDocx =
    file.name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  const [asset, blocks] = await Promise.all([
    writeClient.assets.upload('file', buffer, {filename: file.name, contentType: file.type}),
    isDocx ? docxToBlocks(buffer) : Promise.resolve(null),
  ])

  const patch = writeClient
    .patch(innehallId)
    .set({document: {_type: 'file', asset: {_type: 'reference', _ref: asset._id}}})

  if (blocks && blocks.length > 0) patch.set({body: blocks})

  await patch.commit()

  return {success: true, bodyExtracted: isDocx && !!blocks?.length}
}

export async function uploadBilder(
  innehallId: string,
  _prevState: BilderState,
  formData: FormData,
): Promise<BilderState> {
  const files = formData.getAll('bilder') as File[]
  const validFiles = files.filter((f) => f.size > 0)
  if (validFiles.length === 0) return {error: 'Inga bilder valda.'}

  const uploads = await Promise.all(
    validFiles.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer())
      return writeClient.assets.upload('image', buffer, {filename: file.name, contentType: file.type})
    }),
  )

  const newImages = uploads.map((asset) => ({
    _type: 'image',
    _key: asset._id,
    asset: {_type: 'reference', _ref: asset._id},
  }))

  await writeClient.patch(innehallId).append('images', newImages).commit()

  return {success: true, count: newImages.length}
}
