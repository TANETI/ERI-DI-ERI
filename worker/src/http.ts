import type { Env } from './types'

export class HttpError extends Error {
  status: number
  code: string

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function corsHeaders(
  request: Request,
  env: Env,
) {
  const requestOrigin =
    request.headers.get('Origin')

  const allowed =
    env.ALLOWED_ORIGIN?.trim()

  const origin =
    allowed && requestOrigin === allowed
      ? requestOrigin
      : allowed || 'null'

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods':
      'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      'Authorization,Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

export function jsonResponse(
  request: Request,
  env: Env,
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'Content-Type':
          'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...corsHeaders(request, env),
      },
    },
  )
}

export function assertAuthorized(
  request: Request,
  env: Env,
) {
  const expected =
    env.API_TOKEN?.trim()

  if (!expected) {
    throw new HttpError(
      503,
      'api_token_not_configured',
      'API_TOKEN secret is not configured.',
    )
  }

  const header =
    request.headers.get('Authorization')

  const token =
    header?.startsWith('Bearer ')
      ? header.slice(7)
      : ''

  if (token !== expected) {
    throw new HttpError(
      401,
      'unauthorized',
      'Invalid API token.',
    )
  }
}

export async function readJson<T>(
  request: Request,
): Promise<T> {
  const contentType =
    request.headers.get('Content-Type') ?? ''

  if (
    !contentType
      .toLowerCase()
      .includes('application/json')
  ) {
    throw new HttpError(
      415,
      'json_required',
      'Content-Type must be application/json.',
    )
  }

  try {
    return await request.json() as T
  } catch {
    throw new HttpError(
      400,
      'invalid_json',
      'Request body is not valid JSON.',
    )
  }
}

export function requireArray<T>(
  value: unknown,
  label: string,
): T[] {
  if (!Array.isArray(value)) {
    throw new HttpError(
      400,
      'array_required',
      `${label} must be an array.`,
    )
  }

  return value as T[]
}

export function requireObject<T>(
  value: unknown,
  label: string,
): T {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new HttpError(
      400,
      'object_required',
      `${label} must be an object.`,
    )
  }

  return value as T
}
