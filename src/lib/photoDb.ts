import type { PhotoMeta } from '../types'

const DB_NAME = 'eri-di-ery-media'
const DB_VERSION = 1
const META_STORE = 'photo-meta'
const BLOB_STORE = 'photo-blobs'

function requestToPromise<T>(
  request: IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB 요청 실패'))
  })
}

function transactionDone(
  transaction: IDBTransaction,
): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB 저장 실패'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB 작업 취소'))
  })
}

let dbPromise: Promise<IDBDatabase> | null = null


function friendlyPhotoError(
  error: unknown,
): Error {
  if (
    error instanceof DOMException &&
    (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )
  ) {
    return new Error(
      '브라우저의 사진 저장 공간이 부족해요. 전체 백업을 받아둔 뒤 오래된 로컬 사진을 정리하거나 R2 연결을 진행해 주세요.',
    )
  }

  return error instanceof Error
    ? error
    : new Error('사진 저장 중 오류가 발생했습니다.')
}


function openPhotoDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(META_STORE)) {
        const meta = db.createObjectStore(META_STORE, {
          keyPath: 'id',
        })
        meta.createIndex('date', 'date', { unique: false })
        meta.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('사진 저장소를 열지 못했습니다.'))
  })

  return dbPromise
}

export const photoStore = {
  async listMeta(): Promise<PhotoMeta[]> {
    const db = await openPhotoDb()
    const tx = db.transaction(META_STORE, 'readonly')
    const values = await requestToPromise(
      tx.objectStore(META_STORE).getAll(),
    )

    return (values as PhotoMeta[]).sort((a, b) =>
      `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`),
    )
  },

  async add(
    file: File,
    date: string,
    isCover: boolean,
  ): Promise<PhotoMeta> {
    const db = await openPhotoDb()
    const id = crypto.randomUUID()

    const meta: PhotoMeta = {
      id,
      date,
      createdAt: new Date().toISOString(),
      isCover,
      fileName: file.name || `eri-${date}.jpg`,
      mimeType: file.type || 'image/jpeg',
      sizeBytes: file.size,
    }

    const tx = db.transaction(
      [META_STORE, BLOB_STORE],
      'readwrite',
    )

    tx.objectStore(META_STORE).put(meta)
    tx.objectStore(BLOB_STORE).put(file, id)

    try {
      await transactionDone(tx)
    } catch (error) {
      throw friendlyPhotoError(error)
    }

    return meta
  },

  async saveMeta(meta: PhotoMeta): Promise<void> {
    const db = await openPhotoDb()
    const tx = db.transaction(META_STORE, 'readwrite')
    tx.objectStore(META_STORE).put(meta)
    await transactionDone(tx)
  },

  async getBlob(id: string): Promise<Blob | null> {
    const db = await openPhotoDb()
    const tx = db.transaction(BLOB_STORE, 'readonly')
    const value = await requestToPromise(
      tx.objectStore(BLOB_STORE).get(id),
    )
    return value instanceof Blob ? value : null
  },

  async delete(id: string): Promise<void> {
    const db = await openPhotoDb()
    const tx = db.transaction(
      [META_STORE, BLOB_STORE],
      'readwrite',
    )
    tx.objectStore(META_STORE).delete(id)
    tx.objectStore(BLOB_STORE).delete(id)
    await transactionDone(tx)
  },

  async replaceAll(
    entries: Array<{ meta: PhotoMeta; blob: Blob }>,
  ): Promise<void> {
    const db = await openPhotoDb()
    const tx = db.transaction(
      [META_STORE, BLOB_STORE],
      'readwrite',
    )

    const metaStore = tx.objectStore(META_STORE)
    const blobStore = tx.objectStore(BLOB_STORE)

    metaStore.clear()
    blobStore.clear()

    entries.forEach(({ meta, blob }) => {
      metaStore.put(meta)
      blobStore.put(blob, meta.id)
    })

    await transactionDone(tx)
  },
}
