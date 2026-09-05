import { appRepository } from '../data'
import type {
  PhotoMeta,
  StructuredDataSnapshot,
} from '../types'

const FULL_KIND = 'eri-di-ery-full-backup'
const JSON_KIND = 'eri-di-ery-structured-backup'
const SCHEMA_VERSION = 1

type FullManifest = {
  kind: typeof FULL_KIND
  schemaVersion: number
  exportedAt: string
  app: 'ERI DI-ERY'
  photoCount: number
}

type StructuredBackupFile = {
  kind: typeof JSON_KIND
  schemaVersion: number
  exportedAt: string
  app: 'ERI DI-ERY'
  note: string
  data: StructuredDataSnapshot
}

type FullDataFile = {
  schemaVersion: number
  data: StructuredDataSnapshot
  photos: PhotoMeta[]
}

type TarEntry = {
  name: string
  data: Uint8Array
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function safeDateStamp() {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}_${hh}${mi}`
}

function downloadBlob(
  blob: Blob,
  fileName: string,
) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function jsonBytes(value: unknown) {
  return encoder.encode(
    JSON.stringify(value, null, 2),
  )
}

function writeString(
  target: Uint8Array,
  offset: number,
  length: number,
  value: string,
) {
  const bytes = encoder.encode(value)
  target.set(
    bytes.slice(0, length),
    offset,
  )
}

function writeOctal(
  target: Uint8Array,
  offset: number,
  length: number,
  value: number,
) {
  const octal = Math.max(0, Math.floor(value))
    .toString(8)
    .padStart(length - 1, '0')
    .slice(-(length - 1))

  writeString(
    target,
    offset,
    length - 1,
    octal,
  )
  target[offset + length - 1] = 0
}

function tarHeader(
  name: string,
  size: number,
) {
  const header = new Uint8Array(512)

  writeString(header, 0, 100, name)
  writeOctal(header, 100, 8, 0o644)
  writeOctal(header, 108, 8, 0)
  writeOctal(header, 116, 8, 0)
  writeOctal(header, 124, 12, size)
  writeOctal(
    header,
    136,
    12,
    Math.floor(Date.now() / 1000),
  )

  for (let i = 148; i < 156; i++) {
    header[i] = 32
  }

  header[156] = '0'.charCodeAt(0)

  writeString(header, 257, 6, 'ustar')
  writeString(header, 263, 2, '00')
  writeString(header, 265, 32, 'ERI-DI-ERY')
  writeString(header, 297, 32, 'ERI-DI-ERY')

  const checksum = header.reduce(
    (sum, value) => sum + value,
    0,
  )

  const checksumText = checksum
    .toString(8)
    .padStart(6, '0')
    .slice(-6)

  writeString(header, 148, 6, checksumText)
  header[154] = 0
  header[155] = 32

  return header
}

function createTar(
  entries: TarEntry[],
) {
  const chunks: Uint8Array[] = []
  let total = 0

  entries.forEach((entry) => {
    const header = tarHeader(
      entry.name,
      entry.data.byteLength,
    )

    chunks.push(header)
    total += header.byteLength

    chunks.push(entry.data)
    total += entry.data.byteLength

    const padding =
      (512 - (entry.data.byteLength % 512)) % 512

    if (padding) {
      const pad = new Uint8Array(padding)
      chunks.push(pad)
      total += padding
    }
  })

  const end = new Uint8Array(1024)
  chunks.push(end)
  total += end.byteLength

  const result = new Uint8Array(total)
  let cursor = 0

  chunks.forEach((chunk) => {
    result.set(chunk, cursor)
    cursor += chunk.byteLength
  })

  return result
}

function parseOctal(
  bytes: Uint8Array,
) {
  const text = decoder
    .decode(bytes)
    .replace(/\0/g, '')
    .trim()

  return text
    ? Number.parseInt(text, 8)
    : 0
}

function parseTar(
  data: ArrayBuffer,
) {
  const bytes = new Uint8Array(data)
  const files = new Map<string, Uint8Array>()

  let offset = 0

  while (offset + 512 <= bytes.byteLength) {
    const header = bytes.slice(
      offset,
      offset + 512,
    )

    const empty = header.every(
      (value) => value === 0,
    )

    if (empty) break

    const rawName = header.slice(0, 100)
    const zeroAt = rawName.indexOf(0)
    const name = decoder.decode(
      zeroAt >= 0
        ? rawName.slice(0, zeroAt)
        : rawName,
    )

    const size = parseOctal(
      header.slice(124, 136),
    )

    const dataStart = offset + 512
    const dataEnd = dataStart + size

    if (
      !name ||
      dataEnd > bytes.byteLength
    ) {
      throw new Error(
        '백업 TAR 구조가 올바르지 않습니다.',
      )
    }

    files.set(
      name,
      bytes.slice(dataStart, dataEnd),
    )

    offset =
      dataStart +
      Math.ceil(size / 512) * 512
  }

  return files
}

function csvEscape(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  const text =
    typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)

  return `"${text.replaceAll('"', '""')}"`
}

function makeCsv<T extends object>(
  rows: T[],
) {
  if (!rows.length) {
    return encoder.encode('')
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) =>
        set.add(key),
      )
      return set
    }, new Set<string>()),
  )

  const lines = [
    headers
      .map(csvEscape)
      .join(','),
    ...rows.map((row) =>
      headers
        .map((header) =>
          csvEscape(
            (row as Record<string, unknown>)[header],
          ),
        )
        .join(','),
    ),
  ]

  return encoder.encode(
    `\uFEFF${lines.join('\r\n')}`,
  )
}

function structuredCsvEntries(
  data: StructuredDataSnapshot,
): TarEntry[] {
  return [
    {
      name: 'csv/settings.csv',
      data: makeCsv([data.settings]),
    },
    {
      name: 'csv/feeding.csv',
      data: makeCsv(data.feedingLogs),
    },
    {
      name: 'csv/weight.csv',
      data: makeCsv(data.weightLogs),
    },
    {
      name: 'csv/tmi.csv',
      data: makeCsv(data.tmiLogs),
    },
    {
      name: 'csv/presets.csv',
      data: makeCsv(data.presetSelections),
    },
    {
      name: 'csv/defecation.csv',
      data: makeCsv(data.defecationLogs),
    },
    {
      name: 'csv/evaluations.csv',
      data: makeCsv(data.evaluationLogs),
    },
    {
      name: 'csv/decisions.csv',
      data: makeCsv(data.managementDecisions),
    },
    {
      name: 'csv/legacy-environment.csv',
      data: makeCsv(data.environmentLogs),
    },
  ]
}

function extensionForPhoto(
  photo: PhotoMeta,
) {
  const nameMatch =
    photo.fileName.match(/\.([a-z0-9]{1,8})$/i)

  if (nameMatch) {
    return nameMatch[1].toLowerCase()
  }

  const mimeExtensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }

  return (
    mimeExtensions[photo.mimeType] ??
    'img'
  )
}

function validateStructuredData(
  value: unknown,
): StructuredDataSnapshot {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    throw new Error(
      '백업의 구조화 기록을 읽을 수 없습니다.',
    )
  }

  const data =
    value as Partial<StructuredDataSnapshot>

  if (
    !data.settings ||
    !Array.isArray(data.feedingLogs) ||
    !Array.isArray(data.weightLogs) ||
    !Array.isArray(data.tmiLogs) ||
    !Array.isArray(data.presetSelections) ||
    !Array.isArray(data.defecationLogs) ||
    !Array.isArray(data.evaluationLogs) ||
    !Array.isArray(data.managementDecisions)
  ) {
    throw new Error(
      'ERI DI-ERY 백업 형식이 아니거나 필요한 기록이 빠져 있습니다.',
    )
  }

  return {
    settings: data.settings,
    feedingLogs: data.feedingLogs,
    weightLogs: data.weightLogs,
    tmiLogs: data.tmiLogs,
    presetSelections: data.presetSelections,
    environmentLogs:
      Array.isArray(data.environmentLogs)
        ? data.environmentLogs
        : [],
    defecationLogs: data.defecationLogs,
    evaluationLogs: data.evaluationLogs,
    managementDecisions:
      data.managementDecisions,
  }
}

export async function downloadFullBackup() {
  const data =
    await appRepository.getStructuredData()

  const photos =
    await appRepository.listPhotos()

  const manifest: FullManifest = {
    kind: FULL_KIND,
    schemaVersion: SCHEMA_VERSION,
    exportedAt:
      new Date().toISOString(),
    app: 'ERI DI-ERY',
    photoCount: photos.length,
  }

  const entries: TarEntry[] = [
    {
      name: 'manifest.json',
      data: jsonBytes(manifest),
    },
    {
      name: 'data.json',
      data: jsonBytes({
        schemaVersion: SCHEMA_VERSION,
        data,
        photos,
      } satisfies FullDataFile),
    },
    ...structuredCsvEntries(data),
  ]

  for (const photo of photos) {
    const blob =
      await appRepository.getPhotoBlob(photo.id)

    if (!blob) {
      throw new Error(
        `${photo.date} 사진 원본 하나를 읽지 못해 전체 백업을 중단했어요. 사진 목록을 확인한 뒤 다시 시도해 주세요.`,
      )
    }

    entries.push({
      name:
        `photos/${photo.id}.` +
        extensionForPhoto(photo),
      data: new Uint8Array(
        await blob.arrayBuffer(),
      ),
    })
  }

  const tar = createTar(entries)

  downloadBlob(
    new Blob(
      [tar],
      {
        type: 'application/x-tar',
      },
    ),
    `ERI_DI_ERY_full_backup_${safeDateStamp()}.tar`,
  )

  return {
    photoCount: photos.length,
    fileCount: entries.length,
  }
}

export async function downloadStructuredJson() {
  const payload: StructuredBackupFile = {
    kind: JSON_KIND,
    schemaVersion: SCHEMA_VERSION,
    exportedAt:
      new Date().toISOString(),
    app: 'ERI DI-ERY',
    note:
      '구조화 기록 전용 백업입니다. 사진 원본은 포함되지 않습니다.',
    data:
      await appRepository.getStructuredData(),
  }

  downloadBlob(
    new Blob(
      [
        JSON.stringify(
          payload,
          null,
          2,
        ),
      ],
      {
        type: 'application/json;charset=utf-8',
      },
    ),
    `ERI_DI_ERY_records_${safeDateStamp()}.json`,
  )
}

export async function downloadCsvBundle() {
  const data =
    await appRepository.getStructuredData()

  const entries = [
    {
      name: 'README.txt',
      data: encoder.encode(
        [
          'ERI DI-ERY CSV export',
          `Exported: ${new Date().toISOString()}`,
          '',
          '사진 원본은 포함되지 않습니다.',
          '중첩 값은 JSON 문자열로 한 셀에 들어갈 수 있습니다.',
        ].join('\r\n'),
      ),
    },
    ...structuredCsvEntries(data),
  ]

  const tar = createTar(entries)

  downloadBlob(
    new Blob(
      [tar],
      {
        type: 'application/x-tar',
      },
    ),
    `ERI_DI_ERY_csv_${safeDateStamp()}.tar`,
  )
}

async function restoreFullTar(
  file: File,
) {
  const files = parseTar(
    await file.arrayBuffer(),
  )

  const manifestBytes =
    files.get('manifest.json')

  const dataBytes =
    files.get('data.json')

  if (
    !manifestBytes ||
    !dataBytes
  ) {
    throw new Error(
      'ERI DI-ERY 전체 백업에 필요한 파일이 없습니다.',
    )
  }

  const manifest = JSON.parse(
    decoder.decode(manifestBytes),
  ) as FullManifest

  if (
    manifest.kind !== FULL_KIND ||
    manifest.schemaVersion !==
      SCHEMA_VERSION
  ) {
    throw new Error(
      '지원하지 않는 ERI DI-ERY 전체 백업 버전입니다.',
    )
  }

  const payload = JSON.parse(
    decoder.decode(dataBytes),
  ) as FullDataFile

  const structured =
    validateStructuredData(
      payload.data,
    )

  const photoMeta =
    Array.isArray(payload.photos)
      ? payload.photos
      : []

  const photoEntries: Array<{
    meta: PhotoMeta
    blob: Blob
  }> = []

  for (const meta of photoMeta) {
    const prefix =
      `photos/${meta.id}.`

    const matched = [
      ...files.entries(),
    ].find(([name]) =>
      name.startsWith(prefix),
    )

    if (!matched) {
      throw new Error(
        `${meta.date} 사진 파일 하나가 백업에서 누락되었습니다.`,
      )
    }

    const [, bytes] = matched

    // TS 5.9 DOM typings require BlobPart to be backed by ArrayBuffer,
    // not the wider ArrayBufferLike type carried by Uint8Array.
    const photoBuffer =
      new ArrayBuffer(bytes.byteLength)

    new Uint8Array(photoBuffer).set(
      bytes,
    )

    photoEntries.push({
      meta,
      blob: new Blob(
        [photoBuffer],
        {
          type:
            meta.mimeType ||
            'application/octet-stream',
        },
      ),
    })
  }

  // 먼저 사진을 완전히 복원한 뒤 구조화 기록을 교체한다.
  await appRepository.replacePhotos(
    photoEntries,
  )

  await appRepository.replaceStructuredData(
    structured,
  )

  return {
    kind: 'full' as const,
    photoCount: photoEntries.length,
  }
}

async function restoreStructuredJson(
  file: File,
) {
  const raw =
    await file.text()

  const payload = JSON.parse(
    raw,
  ) as StructuredBackupFile

  if (
    payload.kind !== JSON_KIND ||
    payload.schemaVersion !==
      SCHEMA_VERSION
  ) {
    throw new Error(
      '지원하지 않는 ERI DI-ERY JSON 백업입니다.',
    )
  }

  const structured =
    validateStructuredData(
      payload.data,
    )

  await appRepository.replaceStructuredData(
    structured,
  )

  return {
    kind: 'structured' as const,
    photoCount: null,
  }
}

export async function restoreBackupFile(
  file: File,
) {
  const lower =
    file.name.toLowerCase()

  if (
    lower.endsWith('.tar') ||
    file.type === 'application/x-tar'
  ) {
    return restoreFullTar(file)
  }

  if (
    lower.endsWith('.json') ||
    file.type.includes('json')
  ) {
    return restoreStructuredJson(file)
  }

  throw new Error(
    '전체 .tar 백업 또는 기록 .json 백업을 선택해 주세요.',
  )
}
