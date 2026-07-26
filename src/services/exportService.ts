import type { UserProfile, LifeEvent } from '@/types';
import { userService, eventService, db, normalizeEvent } from './storageService';
import { toPng, toJpeg } from 'html-to-image';

// ============ 导出数据结构 ============
export interface ExportData {
  version: string;            // 导出格式版本
  exportedAt: string;         // 导出时间 ISO
  user: UserProfile | null;   // 用户档案
  events: LifeEvent[];        // 所有事件
}

const EXPORT_VERSION = '2.0';

// ============ 导出 ============

/**
 * 导出当前用户的所有数据为 JSON 对象
 */
export async function exportUserData(userId: string): Promise<ExportData> {
  const user = (await userService.getUser(userId)) ?? null;
  const events = await eventService.getEventsByUser(userId);

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    user,
    events,
  };
}

/**
 * 将数据导出为 JSON 文件并触发浏览器下载
 */
export async function downloadExportJson(userId: string): Promise<void> {
  const data = await exportUserData(userId);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const userName = data.user?.name || 'life-point';
  const date = new Date().toISOString().slice(0, 10);
  const filename = `life-point-${userName}-${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============ 导入 ============

export interface ImportResult {
  success: boolean;
  importedEvents: number;
  importedUser: boolean;
  error?: string;
}

/**
 * 解析 JSON 字符串为导出数据结构
 * @throws 格式不合法时抛出错误
 */
export function parseExportJson(jsonText: string): ExportData {
  const data = JSON.parse(jsonText);

  if (!data || typeof data !== 'object') {
    throw new Error('文件内容不是有效的 JSON 对象');
  }
  if (!data.version || !data.exportedAt) {
    throw new Error('文件格式不正确：缺少版本或导出时间字段');
  }
  if (!Array.isArray(data.events)) {
    throw new Error('文件格式不正确：事件列表缺失');
  }

  return data as ExportData;
}

/**
 * 从导出数据恢复到本地数据库
 * - 如果有用户档案，会覆盖当前用户
 * - 事件会先清空再导入（全量替换）
 *
 * @param data     导出数据
 * @param replaceExisting 是否替换现有数据（true=先清空再导入，false=追加）
 */
export async function importUserData(
  data: ExportData,
  replaceExisting: boolean = true
): Promise<ImportResult> {
  try {
    // 导入用户档案
    let importedUser = false;
    if (data.user && data.user.id && data.user.name) {
      await userService.saveUser(data.user);
      importedUser = true;
    }

    // 导入事件
    if (data.events.length > 0) {
      if (replaceExisting && data.user) {
        // 清空该用户的旧事件
        await eventService.deleteEventsByUser(data.user.id);
      }

      // 批量写入新事件。v1.0 导出不含 v0.4.0 字段，也要套用同一默认值。
      await db.events.bulkPut(data.events.map(normalizeEvent));
    }

    return {
      success: true,
      importedEvents: data.events.length,
      importedUser,
    };
  } catch (err) {
    return {
      success: false,
      importedEvents: 0,
      importedUser: false,
      error: err instanceof Error ? err.message : '导入数据时发生未知错误',
    };
  }
}

/**
 * 从文件读取并导入数据
 */
export async function importFromFile(file: File, replaceExisting: boolean = true): Promise<ImportResult> {
  const text = await file.text();
  const data = parseExportJson(text);
  return importUserData(data, replaceExisting);
}

// ============ 图片导出（Phase 3） ============

export interface ImageExportOptions {
  /** 输出文件名（不含扩展名） */
  filename?: string;
  /** 像素比，默认 2（Retina 清晰度） */
  pixelRatio?: number;
  /** 背景色，默认根据当前主题自动选择（浅色 #FFFFFF / 深色 #1A1918） */
  backgroundColor?: string;
  /** 输出格式，默认 png */
  format?: 'png' | 'jpeg';
  /** jpeg 质量 0-1，默认 0.92 */
  quality?: number;
}

/** 根据当前 <html> 是否有 .dark 类，返回合适的背景色 */
function pickDefaultBackground(): string {
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? '#1A1918' : '#FFFFFF';
}

/** 触发浏览器下载 dataURL */
function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 将任意 DOM 节点导出为图片并下载
 *
 * 注意事项：
 * - 节点内的图片必须同源或允许跨域，否则会被 canvas 污染导致导出失败
 * - 导出前会临时移除节点上的 hover/scroll 状态影响
 * - 深色模式下会自动填充对应背景色，避免透明背景
 */
export async function exportNodeToImage(
  node: HTMLElement,
  options: ImageExportOptions = {}
): Promise<void> {
  const {
    filename = 'life-point',
    pixelRatio = 2,
    backgroundColor = pickDefaultBackground(),
    format = 'png',
    quality = 0.92,
  } = options;

  const finalFilename = `${filename}-${new Date().toISOString().slice(0, 10)}.${format}`;

  const commonOptions = {
    pixelRatio,
    backgroundColor,
    // 缓存禁用避免某些样式还没渲染好
    cacheBust: true,
    // 略微扩大边距，避免边缘被裁
    width: node.scrollWidth,
    height: node.scrollHeight,
  };

  const dataUrl = format === 'jpeg'
    ? await toJpeg(node, { ...commonOptions, quality })
    : await toPng(node, commonOptions);

  downloadDataUrl(dataUrl, finalFilename);
}

/**
 * 生成带用户名的导出文件名
 */
export function buildExportFilename(user: UserProfile | null | undefined, prefix: string): string {
  const userName = user?.name || 'life-point';
  // 过滤文件名非法字符
  const safeName = userName.replace(/[\\/:*?"<>|]/g, '_');
  return `${prefix}-${safeName}`;
}
