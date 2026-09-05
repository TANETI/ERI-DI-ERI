import {
  deletePhotoMeta,
  readPhotoMeta,
  readPhotoRow,
  readSnapshot,
  replaceDefecationLogs,
  replaceEvaluationLogs,
  replaceFeedingLogs,
  replaceManagementDecisions,
  replacePresetSelections,
  replaceSettings,
  replaceSnapshot,
  replaceTmiLogs,
  replaceWeightLogs,
  updatePhotoMeta,
  upsertPhotoMeta,
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
const SERVICE_VERSION = '5.3'

function routeKey(
  request: Request,
) {
  const url = new URL(request.url)
  return `${request.method.toUpperCase()} ${url.pathname}`
}


const MAX_PHOTO_BYTES =
  30 * 1024 * 1024

function photoObjectKey(
  id: string,
) {
  return `photos/${id}`
}

function assertPhotoMeta(
  value: unknown,
): PhotoMeta {
  const meta =
    requireObject<PhotoMeta>(
      value,
      'photo metadata',
    )

  if (
    !meta.id ||
    !meta.date ||
    !meta.createdAt ||
    !meta.fileName ||
    !meta.mimeType ||
    !Number.isFinite(meta.sizeBytes)
  ) {
    throw new HttpError(
      400,
      'invalid_photo_metadata',
      'Photo metadata is incomplete.',
    )
  }

  return meta
}

async function uploadPhoto(
  request: Request,
  env: Env,
) {
  const form =
    await request.formData()

  const rawMeta =
    form.get('meta')
  const file =
    form.get('file')

  if (
    typeof rawMeta !== 'string' ||
    !(file instanceof File)
  ) {
    throw new HttpError(
      400,
      'invalid_photo_upload',
      'Photo upload requires meta and file fields.',
    )
  }

  let parsedMeta: unknown

  try {
    parsedMeta =
      JSON.parse(rawMeta)
  } catch {
    throw new HttpError(
      400,
      'invalid_photo_metadata',
      'Photo metadata is not valid JSON.',
    )
  }

  const meta =
    assertPhotoMeta(parsedMeta)

  if (
    !file.type.startsWith('image/')
  ) {
    throw new HttpError(
      415,
      'image_required',
      'Only image files are accepted.',
    )
  }

  if (
    file.size >
      MAX_PHOTO_BYTES
  ) {
    throw new HttpError(
      413,
      'photo_too_large',
      'Photo exceeds the 30 MiB limit.',
    )
  }

  const normalizedMeta: PhotoMeta = {
    ...meta,
    fileName:
      meta.fileName || file.name,
    mimeType:
      file.type ||
      meta.mimeType ||
      'image/jpeg',
    sizeBytes: file.size,
  }

  const objectKey =
    photoObjectKey(meta.id)

  await env.PHOTOS.put(
    objectKey,
    await file.arrayBuffer(),
    {
      httpMetadata: {
        contentType:
          normalizedMeta.mimeType,
      },
      customMetadata: {
        photoId: normalizedMeta.id,
        date: normalizedMeta.date,
      },
    },
  )

  try {
    await upsertPhotoMeta(
      env.DB,
      normalizedMeta,
      objectKey,
    )
  } catch (error) {
    await env.PHOTOS.delete(
      objectKey,
    )
    throw error
  }

  return normalizedMeta
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

  if (
    request.method === 'POST' &&
    url.pathname === '/api/v1/photos'
  ) {
    const photo =
      await uploadPhoto(
        request,
        env,
      )

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        photo,
      },
      201,
    )
  }

  const photoMatch =
    url.pathname.match(
      /^\/api\/v1\/photos\/([^/]+)(?:\/(content|meta))?$/,
    )

  if (photoMatch) {
    const id =
      decodeURIComponent(
        photoMatch[1],
      )
    const action =
      photoMatch[2]

    if (
      request.method === 'GET' &&
      action === 'content'
    ) {
      const row =
        await readPhotoRow(
          env.DB,
          id,
        )

      if (!row?.object_key) {
        throw new HttpError(
          404,
          'photo_not_found',
          'Photo metadata was not found.',
        )
      }

      const object =
        await env.PHOTOS.get(
          row.object_key,
        )

      if (!object) {
        throw new HttpError(
          404,
          'photo_object_missing',
          'Photo object was not found in R2.',
        )
      }

      return new Response(
        object.body,
        {
          status: 200,
          headers: {
            'Content-Type':
              object.httpMetadata?.contentType ??
              row.mime_type ??
              'application/octet-stream',
            'Content-Length':
              String(object.size),
            'Cache-Control':
              'private, no-store',
            ...(object.httpEtag
              ? {
                  ETag:
                    object.httpEtag,
                }
              : {}),
            ...corsHeaders(
              request,
              env,
            ),
          },
        },
      )
    }

    if (
      request.method === 'PUT' &&
      action === 'meta'
    ) {
      const body =
        await readJson<unknown>(
          request,
        )
      const meta =
        assertPhotoMeta(body)

      if (meta.id !== id) {
        throw new HttpError(
          400,
          'photo_id_mismatch',
          'Photo id does not match the route.',
        )
      }

      const updated =
        await updatePhotoMeta(
          env.DB,
          meta,
        )

      if (!updated) {
        throw new HttpError(
          404,
          'photo_not_found',
          'Photo was not found.',
        )
      }

      return jsonResponse(
        request,
        env,
        { ok: true },
      )
    }

    if (
      request.method === 'DELETE' &&
      !action
    ) {
      const row =
        await readPhotoRow(
          env.DB,
          id,
        )

      if (!row) {
        return jsonResponse(
          request,
          env,
          { ok: true },
        )
      }

      if (row.object_key) {
        await env.PHOTOS.delete(
          row.object_key,
        )
      }

      await deletePhotoMeta(
        env.DB,
        id,
      )

      return jsonResponse(
        request,
        env,
        { ok: true },
      )
    }
  }

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
