import type { ApiResp } from '@/api/types'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  token?: string | null
  body?: unknown
  query?: Record<string, string | number | undefined | null>
}

function withQuery(url: string, query?: RequestOptions['query']) {
  if (!query) return url
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    const s = String(v)
    if (!s) continue
    params.set(k, s)
  }
  const qs = params.toString()
  if (!qs) return url
  return `${url}?${qs}`
}

export async function requestJson<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = withQuery(path, opts.query)
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  })

  const text = await res.text()
  const data: ApiResp<T> | null = text ? (JSON.parse(text) as ApiResp<T>) : null
  if (!res.ok) throw new ApiError((data && 'message' in data && data.message) || 'Request failed', res.status)
  if (!data || !('ok' in data) || !data.ok) throw new ApiError((data && 'message' in data && data.message) || 'Request failed', res.status)
  return data.data
}

