type InstallOutcome =
  | 'accepted'
  | 'dismissed'

type InstallPromptEvent =
  Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{
      outcome: InstallOutcome
      platform: string
    }>
  }

let deferredInstallPrompt:
  InstallPromptEvent | null = null

const STATE_EVENT =
  'eri:pwa-state'

function emitState() {
  window.dispatchEvent(
    new Event(STATE_EVENT),
  )
}

export function isPwaStandalone() {
  const iosNavigator =
    navigator as Navigator & {
      standalone?: boolean
    }

  return (
    window.matchMedia(
      '(display-mode: standalone)',
    ).matches ||
    iosNavigator.standalone === true
  )
}

export function isIosBrowser() {
  return /iPad|iPhone|iPod/i.test(
    navigator.userAgent,
  )
}

export function canInstallPwa() {
  return deferredInstallPrompt !== null
}

export function onPwaStateChange(
  listener: () => void,
) {
  window.addEventListener(
    STATE_EVENT,
    listener,
  )

  return () => {
    window.removeEventListener(
      STATE_EVENT,
      listener,
    )
  }
}

export async function installPwa():
Promise<InstallOutcome | 'unavailable'> {
  const prompt =
    deferredInstallPrompt

  if (!prompt) {
    return 'unavailable'
  }

  deferredInstallPrompt = null

  await prompt.prompt()

  const choice =
    await prompt.userChoice

  emitState()

  return choice.outcome
}

export function registerPwa() {
  window.addEventListener(
    'beforeinstallprompt',
    (event) => {
      event.preventDefault()

      deferredInstallPrompt =
        event as InstallPromptEvent

      emitState()
    },
  )

  window.addEventListener(
    'appinstalled',
    () => {
      deferredInstallPrompt = null
      emitState()
    },
  )

  const localHost =
    window.location.hostname ===
      'localhost' ||
    window.location.hostname ===
      '127.0.0.1'

  if (
    localHost ||
    !('serviceWorker' in navigator)
  ) {
    return
  }

  window.addEventListener(
    'load',
    () => {
      void navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
        })
        .then((registration) => {
          const checkForUpdate = () => {
            void registration.update()
          }

          document.addEventListener(
            'visibilitychange',
            () => {
              if (
                document.visibilityState ===
                'visible'
              ) {
                checkForUpdate()
              }
            },
          )
        })
        .catch((error) => {
          console.warn(
            'ERI DI-ERY service worker registration failed',
            error,
          )
        })
    },
    { once: true },
  )
}
