export type RepositoryMode =
  | 'local'
  | 'cloud'

const MODE_KEY =
  'eri-di-ery.repository-mode'

const API_BASE_KEY =
  'eri-di-ery.cloud-api-base'

const DEV_TOKEN_KEY =
  'eri-di-ery.cloud-dev-token'

const DEFAULT_API_BASE =
  'http://localhost:8787'

function hasWindow() {
  return typeof window !== 'undefined'
}

export function getRepositoryMode():
RepositoryMode {
  if (!hasWindow()) return 'local'

  return localStorage.getItem(MODE_KEY) ===
    'cloud'
    ? 'cloud'
    : 'local'
}

export function setRepositoryMode(
  mode: RepositoryMode,
) {
  if (!hasWindow()) return
  localStorage.setItem(MODE_KEY, mode)
}

export function getCloudApiBase() {
  if (!hasWindow()) {
    return DEFAULT_API_BASE
  }

  return (
    localStorage.getItem(API_BASE_KEY) ??
    DEFAULT_API_BASE
  )
}

export function setCloudApiBase(
  value: string,
) {
  if (!hasWindow()) return

  const normalized =
    value.trim().replace(/\/+$/, '')

  if (!normalized) {
    localStorage.removeItem(
      API_BASE_KEY,
    )
    return
  }

  localStorage.setItem(
    API_BASE_KEY,
    normalized,
  )
}

export function getCloudDevToken() {
  if (!hasWindow()) return ''

  return (
    sessionStorage.getItem(
      DEV_TOKEN_KEY,
    ) ?? ''
  )
}

export function setCloudDevToken(
  value: string,
) {
  if (!hasWindow()) return

  const normalized = value.trim()

  if (!normalized) {
    sessionStorage.removeItem(
      DEV_TOKEN_KEY,
    )
    return
  }

  sessionStorage.setItem(
    DEV_TOKEN_KEY,
    normalized,
  )
}

export function clearCloudDevToken() {
  if (!hasWindow()) return

  sessionStorage.removeItem(
    DEV_TOKEN_KEY,
  )
}
