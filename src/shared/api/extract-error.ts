import axios from 'axios'

export function extractError(err: unknown, fallback = 'Unexpected error'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined
    if (data?.error) return data.error
    if (data?.message) return data.message
    if (err.response?.status) return `${err.response.status} ${err.response.statusText}`
    return err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
