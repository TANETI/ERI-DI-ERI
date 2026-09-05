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

function cookieValue(
  request: Request,
  name: string,
) {
  const cookie =
    request.headers.get('Cookie') ?? ''

  for (const part of cookie.split(';')) {
    const trimmed = part.trim()
    const separator =
      trimmed.indexOf('=')

    if (separator < 0) continue

    const key =
      trimmed.slice(0, separator)

    if (key !== name) continue

    return trimmed.slice(
      separator + 1,
    )
  }

  return ''
}

async function hasValidAccessSession(
  request: Request,
  env: Env,
  ctx?: ExecutionContext,
) {
  // Direct Worker invocation:
  // Worker-level Access provides a verified ctx.access.
  if (ctx?.access) {
    return true
  }

  // Workers Static Assets are served through an internal router.
  // Access still authenticates the request, but that router does
  // not forward ctx.access to the user Worker. Verify the Access
  // application token through the team get-identity endpoint.
  const teamDomain =
    env.TEAM_DOMAIN?.trim()
      .replace(/\/+$/, '')

  if (!teamDomain) {
    return false
  }

  const cookieToken =
    cookieValue(
      request,
      'CF_Authorization',
    )

  const assertionToken =
    request.headers.get(
      'Cf-Access-Jwt-Assertion',
    )?.trim() ?? ''

  const accessToken =
    cookieToken ||
    assertionToken

  if (!accessToken) {
    return false
  }

  try {
    const response =
      await fetch(
        `${teamDomain}/cdn-cgi/access/get-identity`,
        {
          method: 'GET',
          headers: {
            Cookie:
              `CF_Authorization=${accessToken}`,
          },
          redirect: 'manual',
        },
      )

    return response.ok
  } catch {
    return false
  }
}

export async function assertAuthorized(
  request: Request,
  env: Env,
  ctx?: ExecutionContext,
) {
  if (
    await hasValidAccessSession(
      request,
      env,
      ctx,
    )
  ) {
    return
  }

  // Development / emergency fallback.
  const expected =
    env.API_TOKEN?.trim()

  const header =
    request.headers.get('Authorization')

  const token =
    header?.startsWith('Bearer ')
      ? header.slice(7)
      : ''

  if (
    expected &&
    token === expected
  ) {
    return
  }

  throw new HttpError(
    401,
    'unauthorized',
    'Cloudflare Access or a valid development token is required.',
  )
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
