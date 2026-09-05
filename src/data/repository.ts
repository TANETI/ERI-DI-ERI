import type {
  AppSettings,
  DefecationLog,
  EvaluationLog,
  FeedingLog,
  ManagementDecision,
  PhotoMeta,
  PresetSelection,
  StructuredDataSnapshot,
  TmiLog,
  WeightLog,
} from '../types'

export type PhotoBlobEntry = {
  meta: PhotoMeta
  blob: Blob
}

/**
 * UI와 실제 저장 위치 사이의 단일 계약.
 *
 * 현재 구현은 localStorage + IndexedDB지만,
 * Cloudflare 단계에서는 같은 인터페이스를 D1 + R2 구현체가 맡는다.
 *
 * 모든 쓰기/조회를 Promise로 통일해 네트워크 저장소로 교체할 때
 * 화면 레이어의 함수 시그니처를 다시 뜯지 않도록 한다.
 */
export interface AppRepository {
  initialize(): Promise<void>

  getStructuredData(): Promise<StructuredDataSnapshot>
  replaceStructuredData(
    data: StructuredDataSnapshot,
  ): Promise<void>

  saveSettings(value: AppSettings): Promise<void>
  saveFeedingLogs(value: FeedingLog[]): Promise<void>
  saveWeightLogs(value: WeightLog[]): Promise<void>
  saveTmiLogs(value: TmiLog[]): Promise<void>
  savePresetSelections(
    value: PresetSelection[],
  ): Promise<void>
  saveDefecationLogs(
    value: DefecationLog[],
  ): Promise<void>
  saveEvaluationLogs(
    value: EvaluationLog[],
  ): Promise<void>
  saveManagementDecisions(
    value: ManagementDecision[],
  ): Promise<void>

  listPhotos(): Promise<PhotoMeta[]>

  addPhoto(
    file: File,
    date: string,
    isCover: boolean,
  ): Promise<PhotoMeta>

  savePhotoMeta(meta: PhotoMeta): Promise<void>
  getPhotoBlob(id: string): Promise<Blob | null>
  deletePhoto(id: string): Promise<void>

  replacePhotos(
    entries: PhotoBlobEntry[],
  ): Promise<void>
}
