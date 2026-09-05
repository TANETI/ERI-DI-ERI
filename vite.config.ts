import {
  defineConfig,
  loadEnv,
} from 'vite'
import react from '@vitejs/plugin-react'

function decodeServiceKey(
  value: string,
) {
  const trimmed =
    value.trim()

  if (!trimmed) {
    return ''
  }

  try {
    return decodeURIComponent(
      trimmed,
    )
  } catch {
    return trimmed
  }
}

export default defineConfig(
  ({ mode }) => {
    const env =
      loadEnv(mode, '.', '')

    const serviceKey =
      decodeServiceKey(
        env.KMA_SERVICE_KEY ?? '',
      )

    return {
      plugins: [react()],

      server: {
        proxy: {
          '/api/weather/kma': {
            target:
              'https://apis.data.go.kr',
            changeOrigin: true,
            secure: true,

            rewrite(path) {
              const [
                ,
                rawQuery = '',
              ] = path.split('?')

              const params =
                new URLSearchParams(
                  rawQuery,
                )

              params.set(
                'serviceKey',
                serviceKey,
              )

              return (
                '/1360000/VilageFcstInfoService_2.0/getVilageFcst?' +
                params.toString()
              )
            },
          },
        },
      },
    }
  },
)
