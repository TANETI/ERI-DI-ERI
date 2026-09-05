import { useMemo, useState } from 'react'
import Card from '../components/Card'
import PhotoImage from '../components/PhotoImage'
import { todayISO } from '../lib/date'
import type { PhotoMeta } from '../types'

type Props = {
  photos: PhotoMeta[]
  loading: boolean
  onAddPhotos: (date: string, files: File[]) => Promise<void>
  onUpdateCaption: (id: string, caption: string) => Promise<void>
  onSetCover: (id: string) => Promise<void>
  onDeletePhoto: (id: string) => Promise<void>
}

export default function AlbumPage({
  photos,
  loading,
  onAddPhotos,
  onUpdateCaption,
  onSetCover,
  onDeletePhoto,
}: Props) {
  const [date, setDate] = useState(todayISO())
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'cover'>('all')
  const [message, setMessage] = useState('')

  const visiblePhotos = useMemo(
    () =>
      photos.filter((photo) =>
        filter === 'cover' ? photo.isCover : true,
      ),
    [photos, filter],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, PhotoMeta[]>()

    visiblePhotos.forEach((photo) => {
      const current = map.get(photo.date) ?? []
      current.push(photo)
      map.set(photo.date, current)
    })

    return [...map.entries()].sort(([a], [b]) =>
      b.localeCompare(a),
    )
  }, [visiblePhotos])

  const handleFiles = async (
    files: FileList | null,
  ) => {
    if (!files?.length) return

    setUploading(true)
    setMessage('')

    try {
      await onAddPhotos(
        date,
        Array.from(files),
      )
      setMessage(`${files.length}장 저장했어요.`)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '사진 저장에 실패했어요.',
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="page album-page">
      <header className="section-header">
        <div>
          <p className="eyebrow">날짜와 연결되는 사진 기록</p>
          <h1>앨범</h1>
        </div>

        <div className="album-filter">
          <button
            type="button"
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button
            type="button"
            className={filter === 'cover' ? 'active' : ''}
            onClick={() => setFilter('cover')}
          >
            대표 사진
          </button>
        </div>
      </header>

      <Card className="album-upload-card">
        <div className="album-upload-row">
          <label className="field compact-field">
            <span>사진 날짜</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label className={`album-upload-button ${uploading ? 'disabled' : ''}`}>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(event) => {
                void handleFiles(event.target.files)
                event.target.value = ''
              }}
            />
            <span aria-hidden="true">＋</span>
            {uploading ? '저장 중…' : '사진 추가'}
          </label>
        </div>

        <p className="album-upload-help">
          한 날짜에 여러 장 저장할 수 있어요. 지금은 브라우저의
          IndexedDB에 원본을 보관하고, Cloudflare R2 연결 때 그대로 옮길 구조예요.
        </p>

        {message && (
          <div className="inline-message">{message}</div>
        )}
      </Card>

      {loading ? (
        <Card>
          <div className="album-empty">
            <span aria-hidden="true">📷</span>
            <strong>사진 기록을 불러오는 중…</strong>
          </div>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <div className="album-empty">
            <span aria-hidden="true">📷</span>
            <strong>
              {filter === 'cover'
                ? '아직 대표 사진이 없어요.'
                : '아직 저장한 사진이 없어요.'}
            </strong>
            <p>
              위에서 날짜를 고르고 에리 사진을 추가해보세요.
            </p>
          </div>
        </Card>
      ) : (
        <div className="album-groups">
          {grouped.map(([groupDate, items]) => (
            <section className="album-date-group" key={groupDate}>
              <div className="album-date-head">
                <div>
                  <strong>{formatAlbumDate(groupDate)}</strong>
                  <span>{items.length}장</span>
                </div>
                {items.some((item) => item.isCover) && (
                  <span className="album-cover-label">대표 지정됨</span>
                )}
              </div>

              <div className="album-grid">
                {items.map((photo) => (
                  <PhotoTile
                    key={photo.id}
                    photo={photo}
                    onUpdateCaption={onUpdateCaption}
                    onSetCover={onSetCover}
                    onDeletePhoto={onDeletePhoto}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

function PhotoTile({
  photo,
  onUpdateCaption,
  onSetCover,
  onDeletePhoto,
}: {
  photo: PhotoMeta
  onUpdateCaption: (id: string, caption: string) => Promise<void>
  onSetCover: (id: string) => Promise<void>
  onDeletePhoto: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState(photo.caption ?? '')
  const [busy, setBusy] = useState(false)

  const saveCaption = async () => {
    setBusy(true)
    try {
      await onUpdateCaption(photo.id, caption.trim())
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`album-photo ${photo.isCover ? 'cover' : ''}`}>
      <div className="album-photo-image-wrap">
        <PhotoImage photo={photo} className="album-photo-image" />
        {photo.isCover && (
          <span className="album-photo-cover-badge">대표</span>
        )}
      </div>

      <div className="album-photo-body">
        {editing ? (
          <div className="album-caption-editor">
            <input
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="사진 메모"
              maxLength={120}
            />
            <div>
              <button
                type="button"
                onClick={() => {
                  setCaption(photo.caption ?? '')
                  setEditing(false)
                }}
              >
                취소
              </button>
              <button
                type="button"
                className="save"
                disabled={busy}
                onClick={() => void saveCaption()}
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="album-caption"
            onClick={() => setEditing(true)}
          >
            {photo.caption || '메모 추가'}
          </button>
        )}

        <div className="album-photo-actions">
          <button
            type="button"
            className={photo.isCover ? 'active' : ''}
            disabled={photo.isCover || busy}
            onClick={() => void onSetCover(photo.id)}
          >
            {photo.isCover ? '★ 대표' : '☆ 대표'}
          </button>
          <button
            type="button"
            className="danger-text"
            disabled={busy}
            onClick={() => {
              if (window.confirm('이 사진을 삭제할까요?')) {
                void onDeletePhoto(photo.id)
              }
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </article>
  )
}

function formatAlbumDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}
