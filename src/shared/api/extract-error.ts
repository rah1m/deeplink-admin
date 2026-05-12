import axios from 'axios'

export interface ApiErrorEnvelope {
  code: string
  message: string
}

interface ApiErrorBody {
  error?: ApiErrorEnvelope | string
  message?: string
}

export function extractError(err: unknown, fallback = 'Unexpected error'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBody | undefined
    if (data?.error && typeof data.error === 'object' && data.error.message) {
      return data.error.message
    }
    if (typeof data?.error === 'string') return data.error
    if (data?.message) return data.message
    if (err.response?.status) return `${err.response.status} ${err.response.statusText}`
    return err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function extractErrorCode(err: unknown): string | null {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBody | undefined
    if (data?.error && typeof data.error === 'object' && data.error.code) {
      return data.error.code
    }
  }
  return null
}
