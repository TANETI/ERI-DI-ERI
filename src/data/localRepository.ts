import { photoStore } from '../lib/photoDb'
import { store } from '../lib/storage'
import type { AppRepository } from './repository'

export const localRepository: AppRepository = {
  async initialize() {
    store.initialize()
  },

  async getStructuredData() {
    return store.exportStructuredData()
  },

  async replaceStructuredData(data) {
    store.replaceStructuredData(data)
  },

  async saveSettings(value) {
    store.saveSettings(value)
  },

  async saveFeedingLogs(value) {
    store.saveFeedingLogs(value)
  },

  async saveWeightLogs(value) {
    store.saveWeightLogs(value)
  },

  async saveTmiLogs(value) {
    store.saveTmiLogs(value)
  },

  async savePresetSelections(value) {
    store.savePresetSelections(value)
  },

  async saveDefecationLogs(value) {
    store.saveDefecationLogs(value)
  },

  async saveEvaluationLogs(value) {
    store.saveEvaluationLogs(value)
  },

  async saveManagementDecisions(value) {
    store.saveManagementDecisions(value)
  },

  async listPhotos() {
    return photoStore.listMeta()
  },

  async addPhoto(file, date, isCover) {
    return photoStore.add(
      file,
      date,
      isCover,
    )
  },

  async savePhotoMeta(meta) {
    await photoStore.saveMeta(meta)
  },

  async getPhotoBlob(id) {
    return photoStore.getBlob(id)
  },

  async deletePhoto(id) {
    await photoStore.delete(id)
  },

  async replacePhotos(entries) {
    await photoStore.replaceAll(entries)
  },
}
