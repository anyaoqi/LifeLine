import type { StoredImage } from './storageService'
import { db, eventService } from './storageService'

/**
 * 事件配图服务:Blob 存 IndexedDB images 表,会话内缓存 objectURL。
 * 删除事件时由 eventStore 延迟清理(等待撤销窗口),避免误删不可恢复。
 */

const urlCache = new Map<string, string>()

export function imageUrl(image: StoredImage): string {
  let url = urlCache.get(image.id)
  if (!url) {
    url = URL.createObjectURL(image.blob)
    urlCache.set(image.id, url)
  }
  return url
}

export function forgetImageUrls(ids: string[]) {
  for (const id of ids) {
    const url = urlCache.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      urlCache.delete(id)
    }
  }
}

export const imageService = {
  async getByEvent(eventId: string): Promise<StoredImage[]> {
    const images = await db.images.where('eventId').equals(eventId).toArray()
    return images.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  async getByEvents(eventIds: string[]): Promise<StoredImage[]> {
    if (eventIds.length === 0) return []
    const result: StoredImage[] = []
    // Dexie where('eventId').anyOf(...) 可用,但数量少时逐个查询足够
    for (const id of eventIds) {
      result.push(...(await db.images.where('eventId').equals(id).toArray()))
    }
    return result
  },

  /**
   * 新增配图。封面(coverImageId)由调用方在保存后经 eventStore.updateEvent
   * 设置——直接写库会绕过 Pinia,被下一次事件更新覆盖掉。
   */
  async addImages(eventId: string, files: File[]): Promise<StoredImage[]> {
    const now = Date.now()
    const stored: StoredImage[] = files.map((file, i) => ({
      id: eventService.generateId(),
      eventId,
      blob: file,
      createdAt: new Date(now + i).toISOString(),
    }))
    await db.images.bulkAdd(stored)
    return stored
  },

  async deleteImages(ids: string[]): Promise<void> {
    await db.images.bulkDelete(ids)
    forgetImageUrls(ids)
  },

  async deleteByEvent(eventId: string): Promise<void> {
    const images = await db.images.where('eventId').equals(eventId).toArray()
    await this.deleteImages(images.map(i => i.id))
  },

  async hasImages(eventId: string): Promise<boolean> {
    const count = await db.images.where('eventId').equals(eventId).count()
    return count > 0
  },
}
