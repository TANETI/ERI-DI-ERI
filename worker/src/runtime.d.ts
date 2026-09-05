interface D1Result<T = unknown> {
  success: boolean
  results?: T[]
  error?: string
  meta?: Record<string, unknown>
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  first<T = Record<string, unknown>>(
    columnName?: string,
  ): Promise<T | null>
  run<T = unknown>(): Promise<D1Result<T>>
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]>
}


interface R2HTTPMetadata {
  contentType?: string
}

interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata
  customMetadata?: Record<string, string>
}

interface R2ObjectBody {
  key: string
  size: number
  httpEtag?: string
  httpMetadata?: R2HTTPMetadata
  customMetadata?: Record<string, string>
  body: ReadableStream<Uint8Array>
}

interface R2Object {
  key: string
  size: number
  httpEtag?: string
  httpMetadata?: R2HTTPMetadata
  customMetadata?: Record<string, string>
}

interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream<Uint8Array>,
    options?: R2PutOptions,
  ): Promise<R2Object | null>

  get(key: string): Promise<R2ObjectBody | null>
  head(key: string): Promise<R2Object | null>
  delete(key: string): Promise<void>
}


interface CloudflareAccessIdentity {
  email?: string
  name?: string
  [key: string]: unknown
}

interface CloudflareAccessContext {
  aud?: string
  getIdentity(): Promise<CloudflareAccessIdentity | null>
}

interface ExecutionContext {
  access?: CloudflareAccessContext
}
