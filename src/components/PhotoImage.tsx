import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { appRepository } from '../data'
import type { PhotoMeta } from '../types'

type Props = {
  photo: PhotoMeta
  className?: string
  alt?: string
}

export default function PhotoImage({
  photo,
  className,
  alt,
}: Props) {
  const placeholderRef =
    useRef<HTMLDivElement | null>(null)

  const [shouldLoad, setShouldLoad] =
    useState(false)

  const [src, setSrc] =
    useState('')

  useEffect(() => {
    setSrc('')
    setShouldLoad(false)

    const element =
      placeholderRef.current

    if (
      !element ||
      !('IntersectionObserver' in window)
    ) {
      setShouldLoad(true)
      return
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          if (
            entries.some(
              (entry) =>
                entry.isIntersecting,
            )
          ) {
            setShouldLoad(true)
            observer.disconnect()
          }
        },
        {
          rootMargin: '240px',
        },
      )

    observer.observe(element)

    return () =>
      observer.disconnect()
  }, [photo.id])

  useEffect(() => {
    if (!shouldLoad) return

    let active = true
    let objectUrl = ''

    appRepository
      .getPhotoBlob(photo.id)
      .then((blob) => {
        if (!active || !blob) return

        objectUrl =
          URL.createObjectURL(blob)

        setSrc(objectUrl)
      })
      .catch(() => {
        if (active) setSrc('')
      })

    return () => {
      active = false

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl,
        )
      }
    }
  }, [
    photo.id,
    shouldLoad,
  ])

  if (!src) {
    return (
      <div
        ref={placeholderRef}
        className={`photo-image-loading ${className ?? ''}`.trim()}
        aria-label={
          shouldLoad
            ? '사진 불러오는 중'
            : '사진 불러오기 대기 중'
        }
      >
        <span aria-hidden="true">
          📷
        </span>
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={
        alt ??
        photo.caption ??
        `${photo.date} 에리 사진`
      }
      loading="lazy"
      decoding="async"
    />
  )
}
