export type AppPlatform =
  | 'mobile'
  | 'desktop'

const MOBILE_PATH =
  '/mobile'

const DESKTOP_PATH =
  '/desktop'

export function platformFromPath(
  pathname =
    window.location.pathname,
): AppPlatform | null {
  if (
    pathname === MOBILE_PATH ||
    pathname.startsWith(
      `${MOBILE_PATH}/`,
    )
  ) {
    return 'mobile'
  }

  if (
    pathname === DESKTOP_PATH ||
    pathname.startsWith(
      `${DESKTOP_PATH}/`,
    )
  ) {
    return 'desktop'
  }

  return null
}

export function preferredPlatform():
AppPlatform {
  const coarse =
    window.matchMedia(
      '(pointer: coarse)',
    ).matches

  const narrow =
    window.innerWidth <= 900

  const touchSized =
    coarse &&
    window.innerWidth <= 1100

  return (
    narrow ||
    touchSized
  )
    ? 'mobile'
    : 'desktop'
}

export function ensurePlatformRoute():
AppPlatform {
  const current =
    platformFromPath()

  if (current) {
    return current
  }

  const preferred =
    preferredPlatform()

  const target =
    preferred === 'mobile'
      ? MOBILE_PATH
      : DESKTOP_PATH

  window.history.replaceState(
    {},
    '',
    `${target}${window.location.search}${window.location.hash}`,
  )

  return preferred
}

export function getAppPlatform():
AppPlatform {
  return (
    platformFromPath() ??
    preferredPlatform()
  )
}

export function platformPath(
  platform: AppPlatform,
) {
  return platform === 'mobile'
    ? MOBILE_PATH
    : DESKTOP_PATH
}

export function openPlatform(
  platform: AppPlatform,
) {
  if (
    platform ===
    getAppPlatform()
  ) {
    return
  }

  window.location.assign(
    platformPath(platform),
  )
}

export function platformLabel(
  platform: AppPlatform,
) {
  return platform === 'mobile'
    ? '휴대폰'
    : '컴퓨터'
}

export function configurePlatformManifest(
  platform: AppPlatform,
) {
  document
    .querySelectorAll(
      'link[rel="manifest"]',
    )
    .forEach((node) =>
      node.remove(),
    )

  const manifest =
    document.createElement(
      'link',
    )

  manifest.rel = 'manifest'
  manifest.href =
    platform === 'mobile'
      ? '/manifest-mobile.webmanifest'
      : '/manifest-desktop.webmanifest'

  document.head.appendChild(
    manifest,
  )

  document.title =
    platform === 'mobile'
      ? 'ERI DI-ERY Mobile'
      : 'ERI DI-ERY Desktop'

  document.documentElement.dataset.platform =
    platform
}
