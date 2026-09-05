import { localRepository } from './localRepository'
import {
  getCloudApiBase,
  getCloudDevToken,
  getCloudPhotoMode,
} from './repositoryPreferences'
import type { AppRepository } from './repository'
import type {
  PhotoMeta,
  StructuredDataSnapshot,
} from '../types'
import type {
  PhotoBlobEntry,
} from './repository'

type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

function apiUrl(path: string) {
  const base =
    getCloudApiBase().replace(/\/+$/, '')

  return `${base}${path}`
}


function authHeaders(
  init: HeadersInit = {},
) {
  const headers =
    new Headers(init)

  const devToken =
    getCloudDevToken()

  if (devToken) {
    headers.set(
      'Authorization',
      `Bearer ${devToken}`,
    )
  }

  return headers
}

async function requestRaw(
  path: string,
  init: RequestInit = {},
) {
  const headers =
    authHeaders(init.headers)

  let response: Response

  try {
    response = await fetch(
      apiUrl(path),
      {
        ...init,
        headers,
        credentials: 'include',
        cache: 'no-store',
      },
    )
  } catch {
    throw new Error(
      'Cloudflare Worker에 연결하지 못했어요. Worker 실행 여부와 API 주소를 확인해 주세요.',
    )
  }

  return response
}

async function responseError(
  response: Response,
) {
  let body: ApiErrorBody | null =
    null

  try {
    body =
      await response.json() as ApiErrorBody
  } catch {
    // binary/text response may not be JSON
  }

  const message =
    body?.error?.message

  if (response.status === 401) {
    return new Error(
      message ??
        '클라우드 인증에 실패했어요. 로컬 테스트라면 개발용 API 토큰을 확인해 주세요.',
    )
  }

  if (response.status === 503) {
    return new Error(
      message ??
        'Worker 인증 설정이 아직 준비되지 않았어요.',
    )
  }

  return new Error(
    message ??
      `클라우드 요청에 실패했어요. (${response.status})`,
  )
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers =
    authHeaders(init.headers)

  if (
    init.body !== undefined &&
    !headers.has('Content-Type') &&
    !(init.body instanceof FormData)
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    )
  }

  const response =
    await requestRaw(
      path,
      {
        ...init,
        headers,
      },
    )

  if (!response.ok) {
    throw await responseError(
      response,
    )
  }

  return await response.json() as T
}

async function putJson(
  path: string,
  body: unknown,
) {
  await requestJson<{ ok: true }>(
    path,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  )
}

export async function checkCloudHealth() {
  const base =
    getCloudApiBase().replace(/\/+$/, '')

  let response: Response

  try {
    response = await fetch(
      `${base}/api/health`,
      {
        cache: 'no-store',
      },
    )
  } catch {
    throw new Error(
      'Worker health endpoint에 연결하지 못했어요.',
    )
  }

  if (!response.ok) {
    throw new Error(
      `Worker health 확인에 실패했어요. (${response.status})`,
    )
  }

  const body =
    await response.json() as {
      ok?: boolean
      service?: string
      version?: string
      database?: {
        ok?: boolean
        schemaVersion?: string
      }
    }

  if (
    !body.ok ||
    !body.database?.ok
  ) {
    throw new Error(
      'Worker는 응답했지만 D1 연결 상태가 정상이 아니에요.',
    )
  }

  return body
}

export async function readCloudSnapshot() {
  const payload =
    await requestJson<{
      data: StructuredDataSnapshot
    }>(
      '/api/v1/snapshot',
    )

  if (!payload.data) {
    throw new Error(
      'D1 snapshot 응답에 data가 없어요.',
    )
  }

  return payload.data
}


export async function readCloudPhotos() {
  const payload =
    await requestJson<{
      photos: PhotoMeta[]
    }>(
      '/api/v1/photos/meta',
    )

  return payload.photos ?? []
}

export async function uploadCloudPhoto(
  meta: PhotoMeta,
  blob: Blob,
) {
  const form =
    new FormData()

  form.append(
    'meta',
    JSON.stringify(meta),
  )
  form.append(
    'file',
    blob,
    meta.fileName,
  )

  const payload =
    await requestJson<{
      photo: PhotoMeta
    }>(
      '/api/v1/photos',
      {
        method: 'POST',
        body: form,
      },
    )

  return payload.photo
}

export async function saveCloudPhotoMeta(
  meta: PhotoMeta,
) {
  await putJson(
    `/api/v1/photos/${encodeURIComponent(meta.id)}/meta`,
    meta,
  )
}

export async function getCloudPhotoBlob(
  id: string,
): Promise<Blob | null> {
  const response =
    await requestRaw(
      `/api/v1/photos/${encodeURIComponent(id)}/content`,
    )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw await responseError(
      response,
    )
  }

  return response.blob()
}

export async function deleteCloudPhoto(
  id: string,
) {
  const response =
    await requestRaw(
      `/api/v1/photos/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    )

  if (!response.ok) {
    throw await responseError(
      response,
    )
  }
}

/**
 * Full backup restore / first migration helper.
 *
 * Existing R2 photos are not deleted until every incoming photo
 * has uploaded successfully. This avoids wiping the old set first.
 */
export async function replaceCloudPhotos(
  entries: PhotoBlobEntry[],
) {
  const before =
    await readCloudPhotos()

  const incomingIds =
    new Set(
      entries.map(
        ({ meta }) => meta.id,
      ),
    )

  for (const entry of entries) {
    await uploadCloudPhoto(
      entry.meta,
      entry.blob,
    )
  }

  for (const old of before) {
    if (
      !incomingIds.has(old.id)
    ) {
      await deleteCloudPhoto(
        old.id,
      )
    }
  }
}

export const cloudflareRepository:
AppRepository = {
  async initialize() {
    // protected snapshot 요청이 실제 인증 확인을 담당한다.
  },

  async getStructuredData() {
    return readCloudSnapshot()
  },

  async replaceStructuredData(data) {
    await putJson(
      '/api/v1/snapshot',
      data,
    )
  },

  async saveSettings(value) {
    await putJson(
      '/api/v1/settings',
      value,
    )
  },

  async saveFeedingLogs(value) {
    await putJson(
      '/api/v1/feeding',
      value,
    )
  },

  async saveWeightLogs(value) {
    await putJson(
      '/api/v1/weight',
      value,
    )
  },

  async saveTmiLogs(value) {
    await putJson(
      '/api/v1/tmi',
      value,
    )
  },

  async savePresetSelections(value) {
    await putJson(
      '/api/v1/presets',
      value,
    )
  },

  async saveDefecationLogs(value) {
    await putJson(
      '/api/v1/defecation',
      value,
    )
  },

  async saveEvaluationLogs(value) {
    await putJson(
      '/api/v1/evaluations',
      value,
    )
  },

  async saveManagementDecisions(value) {
    await putJson(
      '/api/v1/decisions',
      value,
    )
  },

  async listPhotos() {
    return getCloudPhotoMode() === 'r2'
      ? readCloudPhotos()
      : localRepository.listPhotos()
  },

  async addPhoto(file, date, isCover) {
    if (
      getCloudPhotoMode() !== 'r2'
    ) {
      return localRepository.addPhoto(
        file,
        date,
        isCover,
      )
    }

    const meta: PhotoMeta = {
      id: crypto.randomUUID(),
      date,
      createdAt:
        new Date().toISOString(),
      isCover,
      fileName:
        file.name ||
        `eri-${date}.jpg`,
      mimeType:
        file.type ||
        'image/jpeg',
      sizeBytes: file.size,
    }

    return uploadCloudPhoto(
      meta,
      file,
    )
  },

  async savePhotoMeta(meta) {
    if (
      getCloudPhotoMode() === 'r2'
    ) {
      await saveCloudPhotoMeta(
        meta,
      )
      return
    }

    await localRepository
      .savePhotoMeta(meta)
  },

  async getPhotoBlob(id) {
    return getCloudPhotoMode() === 'r2'
      ? getCloudPhotoBlob(id)
      : localRepository.getPhotoBlob(id)
  },

  async deletePhoto(id) {
    if (
      getCloudPhotoMode() === 'r2'
    ) {
      await deleteCloudPhoto(id)
      return
    }

    await localRepository.deletePhoto(id)
  },

  async replacePhotos(entries) {
    if (
      getCloudPhotoMode() === 'r2'
    ) {
      await replaceCloudPhotos(
        entries,
      )
      return
    }

    await localRepository.replacePhotos(
      entries,
    )
  },
}
