export type RepositoryMode =
  | 'local'
  | 'cloud'

export type CloudPhotoMode =
  | 'local'
  | 'r2'

const MODE_KEY =
  'eri-di-ery.repository-mode'

const API_BASE_KEY =
  'eri-di-ery.cloud-api-base'

const DEV_TOKEN_KEY =
  'eri-di-ery.cloud-dev-token'

const PHOTO_MODE_KEY =
  'eri-di-ery.cloud-photo-mode'

const DEFAULT_API_BASE =
  'http://localhost:8787'

const PRODUCTION_HOST =
  'eri.issssm.com'

function isProductionHost() {
  return (
    hasWindow() &&
    window.location.hostname ===
      PRODUCTION_HOST
  )
}

function defaultApiBase() {
  if (!hasWindow()) {
    return DEFAULT_API_BASE
  }

  return isProductionHost()
    ? window.location.origin
    : DEFAULT_API_BASE
}

function hasWindow() {
  return typeof window !== 'undefined'
}

export function getRepositoryMode():
RepositoryMode {
  if (!hasWindow()) return 'local'

  const saved =
    localStorage.getItem(MODE_KEY)

  if (saved === 'cloud') {
    return 'cloud'
  }

  if (saved === 'local') {
    return 'local'
  }

  return isProductionHost()
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
    defaultApiBase()
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


export function getCloudPhotoMode():
CloudPhotoMode {
  if (!hasWindow()) return 'local'

  const saved =
    localStorage.getItem(
      PHOTO_MODE_KEY,
    )

  if (saved === 'r2') {
    return 'r2'
  }

  if (saved === 'local') {
    return 'local'
  }

  return isProductionHost()
    ? 'r2'
    : 'local'
}

export function setCloudPhotoMode(
  mode: CloudPhotoMode,
) {
  if (!hasWindow()) return

  localStorage.setItem(
    PHOTO_MODE_KEY,
    mode,
  )
}
