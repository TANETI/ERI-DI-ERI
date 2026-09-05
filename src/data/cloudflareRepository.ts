import { localRepository } from './localRepository'
import {
  getCloudApiBase,
  getCloudDevToken,
} from './repositoryPreferences'
import type { AppRepository } from './repository'
import type {
  StructuredDataSnapshot,
} from '../types'

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

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers =
    new Headers(init.headers)

  if (
    init.body !== undefined &&
    !headers.has('Content-Type')
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    )
  }

  const devToken =
    getCloudDevToken()

  if (devToken) {
    headers.set(
      'Authorization',
      `Bearer ${devToken}`,
    )
  }

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

  let body: unknown = null

  try {
    body = await response.json()
  } catch {
    // JSON이 아닌 오류 응답도 status 기준으로 처리한다.
  }

  if (!response.ok) {
    const errorBody =
      body as ApiErrorBody | null

    const message =
      errorBody?.error?.message

    if (response.status === 401) {
      throw new Error(
        message ??
          '클라우드 인증에 실패했어요. 로컬 테스트라면 개발용 API 토큰을 확인해 주세요.',
      )
    }

    if (response.status === 503) {
      throw new Error(
        message ??
          'Worker 인증 설정이 아직 준비되지 않았어요.',
      )
    }

    throw new Error(
      message ??
        `클라우드 요청에 실패했어요. (${response.status})`,
    )
  }

  return body as T
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

  // Phase 5.2에서는 사진은 기존 브라우저 IndexedDB를 유지한다.
  async listPhotos() {
    return localRepository.listPhotos()
  },

  async addPhoto(file, date, isCover) {
    return localRepository.addPhoto(
      file,
      date,
      isCover,
    )
  },

  async savePhotoMeta(meta) {
    await localRepository.savePhotoMeta(
      meta,
    )
  },

  async getPhotoBlob(id) {
    return localRepository.getPhotoBlob(
      id,
    )
  },

  async deletePhoto(id) {
    await localRepository.deletePhoto(id)
  },

  async replacePhotos(entries) {
    await localRepository.replacePhotos(
      entries,
    )
  },
}
