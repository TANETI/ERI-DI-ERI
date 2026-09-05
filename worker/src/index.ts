import {
  readPhotoMeta,
  readSnapshot,
  replaceDefecationLogs,
  replaceEvaluationLogs,
  replaceFeedingLogs,
  replaceManagementDecisions,
  replacePhotoMeta,
  replacePresetSelections,
  replaceSettings,
  replaceSnapshot,
  replaceTmiLogs,
  replaceWeightLogs,
} from './db'
import {
  HttpError,
  assertAuthorized,
  corsHeaders,
  jsonResponse,
  readJson,
  requireArray,
  requireObject,
} from './http'
import type {
  AppSettings,
  DefecationLog,
  Env,
  EvaluationLog,
  FeedingLog,
  ManagementDecision,
  PhotoMeta,
  PresetSelection,
  StructuredDataSnapshot,
  TmiLog,
  WeightLog,
} from './types'

const API_VERSION = 'v1'
const SERVICE_VERSION = '5.1'

function routeKey(
  request: Request,
) {
  const url = new URL(request.url)
  return `${request.method.toUpperCase()} ${url.pathname}`
}

async function handleRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, env),
    })
  }

  if (
    request.method === 'GET' &&
    url.pathname === '/api/health'
  ) {
    const schemaVersion = await env.DB
      .prepare(`
        SELECT value
        FROM app_meta
        WHERE key = 'schema_version'
      `)
      .first<{ value: string }>()

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        service: 'ERI DI-ERY API',
        version: SERVICE_VERSION,
        api: API_VERSION,
        database:
          schemaVersion?.value
            ? {
                ok: true,
                schemaVersion:
                  schemaVersion.value,
              }
            : {
                ok: false,
                schemaVersion: null,
              },
        time: new Date().toISOString(),
      },
    )
  }

  if (!url.pathname.startsWith('/api/v1/')) {
    throw new HttpError(
      404,
      'not_found',
      'Route not found.',
    )
  }

  assertAuthorized(request, env)

  switch (routeKey(request)) {
    case 'GET /api/v1/snapshot': {
      const data =
        await readSnapshot(env.DB)

      return jsonResponse(
        request,
        env,
        { data },
      )
    }

    case 'PUT /api/v1/snapshot': {
      const body =
        await readJson<unknown>(request)

      const data =
        requireObject<StructuredDataSnapshot>(
          body,
          'snapshot',
        )

      await replaceSnapshot(
        env.DB,
        data,
      )

      return jsonResponse(
        request,
        env,
        { ok: true },
      )
    }

    case 'PUT /api/v1/settings': {
      const body =
        await readJson<unknown>(request)

      await replaceSettings(
        env.DB,
        requireObject<AppSettings>(
          body,
          'settings',
        ),
      )

      return jsonResponse(
        request,
        env,
        { ok: true },
      )
    }

    case 'PUT /api/v1/feeding': {
      const body =
        await readJson<unknown>(request)

      await replaceFeedingLogs(
        env.DB,
        requireArray<FeedingLog>(
          body,
          'feeding logs',
        ),
      )

      return jsonResponse(request, env, { ok: true })
    }

    case 'PUT /api/v1/weight': {
      const body =
        await readJson<unknown>(request)

      await replaceWeightLogs(
        env.DB,
        requireArray<WeightLog>(
          body,
          'weight logs',
        ),
      )

      return jsonResponse(request, env, { ok: true })
    }

    case 'PUT /api/v1/tmi': {
      const body =
        await readJson<unknown>(request)

      await replaceTmiLogs(
        env.DB,
        requireArray<TmiLog>(
          body,
          'TMI logs',
        ),
      )

      return jsonResponse(request, env, { ok: true })
    }

    case 'PUT /api/v1/presets': {
      const body =
        await readJson<unknown>(request)

      await replacePresetSelections(
        env.DB,
        requireArray<PresetSelection>(
          body,
          'preset selections',
        ),
      )

      return jsonResponse(request, env, { ok: true })
    }

    case 'PUT /api/v1/defecation': {
      const body =
        await readJson<unknown>(request)

      await replaceDefecationLogs(
        env.DB,
        requireArray<DefecationLog>(
          body,
          'defecation logs',
        ),
      )

      return jsonResponse(request, env, { ok: true })
    }

    case 'PUT /api/v1/evaluations': {
      const body =
        await readJson<unknown>(request)

      await replaceEvaluationLogs(
        env.DB,
        requireArray<EvaluationLog>(
          body,
          'evaluation logs',
        ),
      )

      return jsonResponse(request, env, { ok: true })
    }

    case 'PUT /api/v1/decisions': {
      const body =
        await readJson<unknown>(request)

      await replaceManagementDecisions(
        env.DB,
        requireArray<ManagementDecision>(
          body,
          'management decisions',
        ),
      )

      return jsonResponse(request, env, { ok: true })
    }

    case 'GET /api/v1/photos/meta': {
      const photos =
        await readPhotoMeta(env.DB)

      return jsonResponse(
        request,
        env,
        { photos },
      )
    }

    case 'PUT /api/v1/photos/meta': {
      const body =
        await readJson<unknown>(request)

      await replacePhotoMeta(
        env.DB,
        requireArray<PhotoMeta>(
          body,
          'photo metadata',
        ),
      )

      return jsonResponse(request, env, { ok: true })
    }

    default:
      throw new HttpError(
        404,
        'not_found',
        'Route not found.',
      )
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    try {
      return await handleRequest(
        request,
        env,
      )
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonResponse(
          request,
          env,
          {
            ok: false,
            error: {
              code: error.code,
              message: error.message,
            },
          },
          error.status,
        )
      }

      console.error(
        'ERI DI-ERY Worker error',
        error,
      )

      return jsonResponse(
        request,
        env,
        {
          ok: false,
          error: {
            code: 'internal_error',
            message:
              'Unexpected Worker error.',
          },
        },
        500,
      )
    }
  },
}
