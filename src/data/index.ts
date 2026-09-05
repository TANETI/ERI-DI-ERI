import {
  cloudflareRepository,
} from './cloudflareRepository'
import {
  localRepository,
} from './localRepository'
import {
  getRepositoryMode,
} from './repositoryPreferences'
import type {
  AppRepository,
} from './repository'

function activeRepository():
AppRepository {
  return getRepositoryMode() ===
    'cloud'
    ? cloudflareRepository
    : localRepository
}

/**
 * UI는 계속 이 객체 하나만 사용한다.
 * 모드 전환 뒤 reload하면 bootstrap부터 선택한 저장소를 읽는다.
 */
export const appRepository:
AppRepository = {
  initialize: () =>
    activeRepository().initialize(),

  getStructuredData: () =>
    activeRepository()
      .getStructuredData(),

  replaceStructuredData: (data) =>
    activeRepository()
      .replaceStructuredData(data),

  saveSettings: (value) =>
    activeRepository()
      .saveSettings(value),

  saveFeedingLogs: (value) =>
    activeRepository()
      .saveFeedingLogs(value),

  saveWeightLogs: (value) =>
    activeRepository()
      .saveWeightLogs(value),

  saveTmiLogs: (value) =>
    activeRepository()
      .saveTmiLogs(value),

  savePresetSelections: (value) =>
    activeRepository()
      .savePresetSelections(value),

  saveDefecationLogs: (value) =>
    activeRepository()
      .saveDefecationLogs(value),

  saveEvaluationLogs: (value) =>
    activeRepository()
      .saveEvaluationLogs(value),

  saveManagementDecisions: (value) =>
    activeRepository()
      .saveManagementDecisions(value),

  listPhotos: () =>
    activeRepository().listPhotos(),

  addPhoto: (
    file,
    date,
    isCover,
  ) =>
    activeRepository().addPhoto(
      file,
      date,
      isCover,
    ),

  savePhotoMeta: (meta) =>
    activeRepository()
      .savePhotoMeta(meta),

  getPhotoBlob: (id) =>
    activeRepository()
      .getPhotoBlob(id),

  deletePhoto: (id) =>
    activeRepository()
      .deletePhoto(id),

  replacePhotos: (entries) =>
    activeRepository()
      .replacePhotos(entries),
}

export {
  cloudflareRepository,
  localRepository,
}

export {
  checkCloudHealth,
  readCloudPhotos,
  readCloudSnapshot,
  replaceCloudPhotos,
} from './cloudflareRepository'

export {
  clearCloudDevToken,
  getCloudApiBase,
  getCloudDevToken,
  getCloudPhotoMode,
  getRepositoryMode,
  setCloudApiBase,
  setCloudDevToken,
  setCloudPhotoMode,
  setRepositoryMode,
} from './repositoryPreferences'

export type {
  CloudPhotoMode,
  RepositoryMode,
} from './repositoryPreferences'

export type {
  AppRepository,
  PhotoBlobEntry,
} from './repository'
