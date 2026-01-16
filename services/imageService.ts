/**
 * 图片服务模块
 *
 * 功能：
 * 1. 多 API 支持：Unsplash、Pexels、Pixabay
 * 2. 本地缓存：localStorage 缓存图片 URL
 * 3. 重试机制：API 失败时自动重试
 * 4. 图片验证：确保 URL 可访问
 * 5. 降级策略：API 失败时使用备选方案
 */

// ============== 类型定义 ==============

export interface ImageSource {
  name: string;
  priority: number; // 1 = 最高优先级
  fetch: (keyword: string, count: number, orientation: ImageOrientation) => Promise<string[]>;
}

export type ImageOrientation = 'landscape' | 'portrait' | 'square';

export interface ImageCacheEntry {
  urls: string[];
  timestamp: number;
  keyword: string;
  orientation: ImageOrientation;
}

export interface ImageFetchOptions {
  keyword: string;
  count?: number;
  orientation?: ImageOrientation;
  useCache?: boolean;
  cacheTTL?: number; // 缓存过期时间（毫秒）
  retries?: number;
  timeout?: number;
}

export interface ImageServiceStats {
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
  failures: number;
}

// ============== 配置 ==============

// 从环境变量获取 API 密钥
declare const __UNSPLASH_ACCESS_KEY__: string | undefined;
declare const __PEXELS_API_KEY__: string | undefined;
declare const __PIXABAY_API_KEY__: string | undefined;

const UNSPLASH_ACCESS_KEY = (typeof __UNSPLASH_ACCESS_KEY__ !== 'undefined')
  ? __UNSPLASH_ACCESS_KEY__
  : 'ddvcLX0OvonRXVoWgkJW4ONa5mtwnwwTbqbZy5qrR-o';

const PEXELS_API_KEY = (typeof __PEXELS_API_KEY__ !== 'undefined')
  ? __PEXELS_API_KEY__
  : 'T0U7tR3NPHNjkGdlnEQJajze4g3BFlSm5zJW6zksp7u2AayTHK5rDtkX';

const PIXABAY_API_KEY = (typeof __PIXABAY_API_KEY__ !== 'undefined')
  ? __PIXABAY_API_KEY__
  : '54117299-dcb02c52c837b8dd9b300f2de';

// 默认配置
const DEFAULT_CONFIG = {
  CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 天
  MAX_RETRIES: 2,
  REQUEST_TIMEOUT: 10000, // 10 秒
  CACHE_PREFIX: 'wanderlust_img_',
};

// 统计信息
const stats: ImageServiceStats = {
  cacheHits: 0,
  cacheMisses: 0,
  apiCalls: 0,
  failures: 0,
};

// ============== 缓存管理 ==============

class ImageCache {
  private enabled: boolean;

  constructor() {
    this.enabled = this.checkCacheAvailability();
  }

  private checkCacheAvailability(): boolean {
    try {
      const test = '__cache_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('[ImageCache] localStorage not available');
      return false;
    }
  }

  get(keyword: string, orientation: ImageOrientation): string[] | null {
    if (!this.enabled) return null;

    try {
      const key = this.makeKey(keyword, orientation);
      const item = localStorage.getItem(key);
      if (!item) return null;

      const entry: ImageCacheEntry = JSON.parse(item);

      // 检查是否过期
      if (Date.now() - entry.timestamp > DEFAULT_CONFIG.CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }

      stats.cacheHits++;
      return entry.urls;
    } catch (e) {
      console.warn('[ImageCache] Get failed:', e);
      return null;
    }
  }

  set(keyword: string, orientation: ImageOrientation, urls: string[]): void {
    if (!this.enabled) return;

    try {
      const key = this.makeKey(keyword, orientation);
      const entry: ImageCacheEntry = {
        urls,
        timestamp: Date.now(),
        keyword,
        orientation,
      };

      localStorage.setItem(key, JSON.stringify(entry));

      // 清理过期缓存
      this.cleanup();
    } catch (e) {
      console.warn('[ImageCache] Set failed:', e);
    }
  }

  private makeKey(keyword: string, orientation: ImageOrientation): string {
    return `${DEFAULT_CONFIG.CACHE_PREFIX}${encodeURIComponent(keyword)}_${orientation}`;
  }

  private cleanup(): void {
    if (!this.enabled) return;

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      for (const key of keys) {
        if (!key.startsWith(DEFAULT_CONFIG.CACHE_PREFIX)) continue;

        const item = localStorage.getItem(key);
        if (!item) continue;

        const entry: ImageCacheEntry = JSON.parse(item);
        if (now - entry.timestamp > DEFAULT_CONFIG.CACHE_TTL) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('[ImageCache] Cleanup failed:', e);
    }
  }

  clear(): void {
    if (!this.enabled) return;

    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(DEFAULT_CONFIG.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('[ImageCache] Clear failed:', e);
    }
  }

  getStats(): { size: number; entries: number } {
    if (!this.enabled) return { size: 0, entries: 0 };

    try {
      const keys = Object.keys(localStorage);
      let size = 0;
      let entries = 0;

      for (const key of keys) {
        if (key.startsWith(DEFAULT_CONFIG.CACHE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            size += item.length;
            entries++;
          }
        }
      }

      return { size, entries };
    } catch {
      return { size: 0, entries: 0 };
    }
  }
}

// ============== 图片 URL 验证 ==============

class ImageValidator {
  private validatedCache = new Map<string, boolean>();

  async validateUrl(url: string, timeout: number = 3000): Promise<boolean> {
    // 检查缓存
    if (this.validatedCache.has(url)) {
      return this.validatedCache.get(url)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      const isValid = response.ok && (contentType?.startsWith('image/') ?? false);
      this.validatedCache.set(url, isValid);

      return isValid;
    } catch {
      this.validatedCache.set(url, false);
      return false;
    }
  }

  async validateUrls(urls: string[], timeout: number = 3000): Promise<string[]> {
    const results = await Promise.allSettled(
      urls.map(url => this.validateUrl(url, timeout))
    );

    return urls.filter((_, i) =>
      results[i].status === 'fulfilled' && results[i].value
    );
  }

  clearCache(): void {
    this.validatedCache.clear();
  }
}

// ============== API 实现 ==============

/**
 * Unsplash API
 * 优点：高质量图片、API 稳定
 * 缺点：需要申请 access key、有请求限制
 */
const unsplashSource: ImageSource = {
  name: 'Unsplash',
  priority: 1,
  fetch: async (keyword: string, count: number, orientation: ImageOrientation): Promise<string[]> => {
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY.length < 10) {
      console.warn('[Unsplash] No valid API key configured');
      return [];
    }

    const orientationMap = {
      landscape: 'landscape',
      portrait: 'portrait',
      square: 'squarish',
    };

    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', keyword);
    url.searchParams.set('per_page', Math.min(count, 30).toString());
    url.searchParams.set('orientation', orientationMap[orientation]);
    url.searchParams.set('client_id', UNSPLASH_ACCESS_KEY);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(DEFAULT_CONFIG.REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // 只返回 URL 字符串（与其他 API 保持一致）
    return data.results.map((photo: any) => photo.urls.regular || photo.urls.large);
  },
};

/**
 * Pexels API
 * 优点：免费、无请求限制、可商用
 * 缺点：图片数量相对较少
 */
const pexelsSource: ImageSource = {
  name: 'Pexels',
  priority: 2,
  fetch: async (keyword: string, count: number, orientation: ImageOrientation): Promise<string[]> => {
    if (!PEXELS_API_KEY || PEXELS_API_KEY.length < 10) {
      console.warn('[Pexels] No valid API key configured');
      return [];
    }

    const url = new URL('https://api.pexels.com/v1/search');
    url.searchParams.set('query', keyword);
    url.searchParams.set('per_page', Math.min(count, 30).toString());
    url.searchParams.set('orientation', orientation);

    const response = await fetch(url.toString(), {
      headers: { Authorization: PEXELS_API_KEY },
      signal: AbortSignal.timeout(DEFAULT_CONFIG.REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.photos || !Array.isArray(data.photos)) {
      return [];
    }

    return data.photos.map((photo: any) => photo.src.large2x || photo.src.large);
  },
};

/**
 * Pixabay API
 * 优点：图片数量多、支持多语言
 * 缺点：图片质量参差不齐
 */
const pixabaySource: ImageSource = {
  name: 'Pixabay',
  priority: 3,
  fetch: async (keyword: string, count: number, orientation: ImageOrientation): Promise<string[]> => {
    if (!PIXABAY_API_KEY || PIXABAY_API_KEY.length < 10) {
      console.warn('[Pixabay] No valid API key configured');
      return [];
    }

    const url = new URL('https://pixabay.com/api/');
    url.searchParams.set('key', PIXABAY_API_KEY);
    url.searchParams.set('q', keyword);
    url.searchParams.set('image_type', 'photo');
    url.searchParams.set('per_page', Math.min(count, 50).toString());
    url.searchParams.set('safesearch', 'true');

    // Pixabay orientation 参数
    if (orientation === 'landscape') {
      url.searchParams.set('min_width', '1600');
    } else if (orientation === 'portrait') {
      url.searchParams.set('min_height', '1200');
    }

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(DEFAULT_CONFIG.REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.hits || !Array.isArray(data.hits)) {
      return [];
    }

    return data.hits.map((hit: any) => hit.largeImageURL || hit.webformatURL);
  },
};

/**
 * Pollinations.ai (备选方案)
 * 优点：无需 API key、始终可用
 * 缺点：AI 生成的图片、质量不稳定
 */
const pollinationsFallback: ImageSource = {
  name: 'Pollinations',
  priority: 999,
  fetch: async (keyword: string, count: number, orientation: ImageOrientation): Promise<string[]> => {
    const dimensions = orientation === 'landscape'
      ? { width: 1600, height: 900 }
      : orientation === 'square'
      ? { width: 1200, height: 1200 }
      : { width: 800, height: 1200 };

    return Array.from({ length: count }, (_, i) =>
      `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword)}+${i + 1}?width=${dimensions.width}&height=${dimensions.height}&nologo=true&seed=${Date.now() + i}`
    );
  },
};

// ============== 主图片服务 ==============

class ImageServiceClass {
  private cache: ImageCache;
  private validator: ImageValidator;
  private sources: ImageSource[];

  constructor() {
    this.cache = new ImageCache();
    this.validator = new ImageValidator();
    this.sources = [unsplashSource, pexelsSource, pixabaySource].filter(s => s !== null);
  }

  /**
   * 获取图片
   */
  async fetchImages(options: ImageFetchOptions): Promise<string[]> {
    const {
      keyword,
      count = 1,
      orientation = 'portrait',
      useCache = true,
      cacheTTL: _cacheTTL = DEFAULT_CONFIG.CACHE_TTL, // Reserved for future use
      retries = DEFAULT_CONFIG.MAX_RETRIES,
      timeout: _timeout = DEFAULT_CONFIG.REQUEST_TIMEOUT, // Reserved for future use
    } = options;

    // 检查缓存
    if (useCache) {
      const cached = this.cache.get(keyword, orientation);
      if (cached && cached.length >= count) {
        console.log(`[ImageService] Cache hit for "${keyword}" (${cached.length} images)`);
        return cached.slice(0, count);
      }
    }

    stats.cacheMisses++;
    console.log(`[ImageService] Fetching "${keyword}" from APIs...`);

    let result: string[] = [];
    let lastError: Error | null = null;

    // 尝试每个 API 源
    for (const source of this.sources.sort((a, b) => a.priority - b.priority)) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          console.log(`[ImageService] Trying ${source.name} (attempt ${attempt + 1}/${retries + 1})...`);
          stats.apiCalls++;

          const images = await source.fetch(keyword, count - result.length, orientation);

          if (images.length > 0) {
            const newImages = images.filter(img => !result.includes(img));
            result = [...result, ...newImages];
            console.log(`[ImageService] ${source.name} returned ${images.length} images`);

            if (result.length >= count) {
              break;
            }
          }
        } catch (error) {
          lastError = error as Error;
          console.warn(`[ImageService] ${source.name} attempt ${attempt + 1} failed:`, error);

          if (attempt < retries) {
            await this.delay(1000 * (attempt + 1)); // 指数退避
          }
        }
      }

      if (result.length >= count) {
        break;
      }
    }

    // 如果所有 API 都失败，使用备选方案
    if (result.length < count) {
      console.warn(`[ImageService] All APIs failed, using fallback`);
      stats.failures++;

      try {
        const fallbackImages = await pollinationsFallback.fetch(keyword, count - result.length, orientation);
        result = [...result, ...fallbackImages];
      } catch (error) {
        console.error('[ImageService] Fallback also failed:', error);
      }
    }

    // 去重并限制数量
    result = Array.from(new Set(result)).slice(0, count);

    // 缓存结果
    if (result.length > 0 && useCache) {
      this.cache.set(keyword, orientation, result);
      console.log(`[ImageService] Cached ${result.length} images for "${keyword}"`);
    }

    if (result.length === 0) {
      console.error(`[ImageService] Failed to fetch any images for "${keyword}"`, lastError);
    }

    return result;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证图片 URL
   */
  async validateImages(urls: string[], timeout: number = 3000): Promise<string[]> {
    return this.validator.validateUrls(urls, timeout);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.validator.clearCache();
  }

  /**
   * 获取统计信息
   */
  getStats(): ImageServiceStats & { cache: ReturnType<ImageCache['getStats']> } {
    return {
      ...stats,
      cache: this.cache.getStats(),
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    stats.cacheHits = 0;
    stats.cacheMisses = 0;
    stats.apiCalls = 0;
    stats.failures = 0;
  }

  /**
   * 快捷方法：获取单张图片
   */
  async fetchOne(keyword: string, orientation: ImageOrientation = 'portrait'): Promise<string> {
    const images = await this.fetchImages({ keyword, count: 1, orientation });
    return images[0] || '';
  }

  /**
   * 快捷方法：获取横幅图片
   */
  async fetchHero(keyword: string): Promise<string> {
    return this.fetchOne(keyword, 'landscape');
  }

  /**
   * 快捷方法：获取网格图片
   */
  async fetchGrid(keyword: string, count: number = 3): Promise<string[]> {
    return this.fetchImages({ keyword, count, orientation: 'portrait' });
  }
}

// ============== 导出 ==============

export const ImageService = new ImageServiceClass();

// 导出配置常量
export const IMAGE_CONFIG = {
  UNSPLASH_ACCESS_KEY,
  PEXELS_API_KEY,
  PIXABAY_API_KEY,
  DEFAULT_CONFIG,
};

// 导出独立的 API 函数（向后兼容）
export async function fetchImages(
  keyword: string,
  count: number = 1,
  orientation: ImageOrientation = 'portrait'
): Promise<string[]> {
  return ImageService.fetchImages({ keyword, count, orientation });
}

export async function fetchHeroImage(keyword: string): Promise<string> {
  return ImageService.fetchHero(keyword);
}

export async function fetchGridImages(keyword: string, count: number = 3): Promise<string[]> {
  return ImageService.fetchGrid(keyword, count);
}
