'use client'

import {useActionState, useRef} from 'react'
import {uploadDokument, uploadBilder} from '@/app/actions'

type DokumentProps = {
  innehallId: string
  hasDokument: boolean
}

export function UploadDokumentForm({innehallId, hasDokument}: DokumentProps) {
  const boundAction = uploadDokument.bind(null, innehallId)
  const [state, action, pending] = useActionState(boundAction, {})
  const formRef = useRef<HTMLFormElement>(null)

  if (state.success && formRef.current) {
    formRef.current.reset()
  }

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <h3 className="font-semibold mb-1">Ladda upp dokument</h3>
      <p className="text-sm text-gray-500 mb-4">
        {hasDokument
          ? 'Det finns redan ett dokument. Ny uppladdning ersätter det.'
          : 'Ladda upp ett Word-dokument (.docx).'}
      </p>
      <form ref={formRef} action={action} className="flex flex-col gap-3">
        <input
          type="file"
          name="dokument"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="text-sm text-green-600">
            Dokumentet laddades upp!
            {state.bodyExtracted && ' Brödtexten extraherades automatiskt.'}
            {state.bodyExtracted === false && ' (Brödtext extraheras bara från .docx-filer.)'}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="self-start bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Laddar upp…' : 'Ladda upp'}
        </button>
      </form>
    </div>
  )
}

export function UploadBilderForm({innehallId}: {innehallId: string}) {
  const boundAction = uploadBilder.bind(null, innehallId)
  const [state, action, pending] = useActionState(boundAction, {})
  const formRef = useRef<HTMLFormElement>(null)

  if (state.success && formRef.current) {
    formRef.current.reset()
  }

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <h3 className="font-semibold mb-1">Ladda upp bilder</h3>
      <p className="text-sm text-gray-500 mb-4">Välj en eller flera bilder (JPG, PNG, HEIC, WebP).</p>
      <form ref={formRef} action={action} className="flex flex-col gap-3">
        <input
          type="file"
          name="bilder"
          accept="image/*"
          multiple
          required
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="text-sm text-green-600">
            {state.count ?? ''} bild(er) laddades upp!
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="self-start bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Laddar upp…' : 'Ladda upp bilder'}
        </button>
      </form>
    </div>
  )
}
