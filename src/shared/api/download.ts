import axios from 'axios'
import { http } from './http'

// With responseType 'blob' an error envelope arrives as a Blob too, which
// extractError can't read, so it is decoded back into JSON first.
async function decodeBlobError(err: unknown) {
  if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
    try {
      err.response.data = JSON.parse(await err.response.data.text())
    } catch {
      // not JSON: extractError falls back to the status line
    }
  }
  return err
}

/**
 * Downloads a file through the authenticated client. A plain <a href> can't
 * carry the Bearer token, and the API doesn't expose Content-Disposition to
 * other origins, so the caller names the file.
 */
export async function downloadFile(
  url: string,
  params: Record<string, unknown>,
  filename: string,
) {
  let blob: Blob
  try {
    blob = (await http.get<Blob>(url, { params, responseType: 'blob' })).data
  } catch (err) {
    throw await decodeBlobError(err)
  }
  // A backend that doesn't know the requested format answers with the JSON
  // list; saved under the file's name it would be a file that won't open.
  if (blob.type.includes('json')) {
    throw new Error(
      "The server didn't return a file — it may not support this export yet.",
    )
  }
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  // Revoked later rather than at once: some browsers drop a download whose
  // URL is revoked in the same tick.
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
