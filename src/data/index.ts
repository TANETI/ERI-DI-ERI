import { localRepository } from './localRepository'
import type { AppRepository } from './repository'

/**
 * Phase 5.0에서는 로컬 구현 하나만 사용한다.
 *
 * 이후에는 이 파일에서 환경 설정에 따라
 * localRepository / cloudflareRepository를 선택하면 된다.
 */
export const appRepository: AppRepository =
  localRepository

export type {
  AppRepository,
  PhotoBlobEntry,
} from './repository'
