/**
 * Web Search Service
 *
 * Integrates with Tavily Search API for web search functionality.
 * Provides caching, error handling, and result formatting.
 */

import {
  WebSearchOptions,
  WebSearchResult,
  SearchCacheEntry,
  SearchCategory
} from '../types';

// Cache configuration
const DEFAULT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100;

class WebSearchService {
  private cache: Map<string, SearchCacheEntry> = new Map();
  private apiKey: string | null = null;

  constructor() {
    // Initialize API key from environment
    this.apiKey = import.meta.env.VITE_TAVILY_API_KEY || null;
  }

  /**
   * Generate cache key from query and category
   */
  private getCacheKey(query: string, category?: SearchCategory): string {
    return `${query.toLowerCase()}-${category || 'general'}`;
  }

  /**
   * Get cached results if available and not expired
   */
  private getCachedResults(query: string, category?: SearchCategory): WebSearchResult[] | null {
    const key = this.getCacheKey(query, category);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.results;
  }

  /**
   * Cache search results
   */
  private cacheResults(query: string, results: WebSearchResult[], category?: SearchCategory, ttl: number = DEFAULT_CACHE_TTL): void {
    const key = this.getCacheKey(query, category);

    // Implement LRU cache eviction
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      query,
      category: category || 'general',
      results,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear all cached results
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Perform web search using Tavily API
   */
  public async search(options: WebSearchOptions): Promise<WebSearchResult[]> {
    const {
      query,
      category = 'general',
      location,
      maxResults = 10,
      useCache = true
    } = options;

    // Check cache first
    if (useCache) {
      const cached = this.getCachedResults(query, category);
      if (cached) {
        return cached;
      }
    }

    // Validate API key
    if (!this.apiKey) {
      console.warn('Tavily API key not configured. Using mock results.');
      return this.getMockResults(query, category);
    }

    try {
      // Build search query with location context
      const searchQuery = location ? `${query} ${location}` : query;

      // Call Tavily API
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: searchQuery,
          search_depth: 'basic',
          max_results: maxResults,
          include_answer: false,
          include_raw_content: false,
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Tavily results to WebSearchResult format
      const results: WebSearchResult[] = (data.results || []).map((item: any, index: number) => ({
        id: `tavily-${Date.now()}-${index}`,
        title: item.title || '',
        url: item.url || '',
        snippet: item.content || '',
        source: this.extractDomain(item.url) || 'unknown',
        score: item.score || 0,
        category,
        publishedDate: item.publishedDate,
        imageUrl: item.image
      }));

      // Cache results
      if (results.length > 0) {
        this.cacheResults(query, results, category);
      }

      return results;

    } catch (error) {
      console.error('Web search failed:', error);
      // Return mock results as fallback
      return this.getMockResults(query, category);
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get mock search results for testing/fallback
   */
  private getMockResults(query: string, category: SearchCategory): WebSearchResult[] {
    const mockResults: WebSearchResult[] = [
      {
        id: `mock-${Date.now()}-1`,
        title: `${query} - 相关结果 1`,
        url: 'https://example.com/result1',
        snippet: `这是一个关于 "${query}" 的模拟搜索结果。实际搜索功能需要配置 Tavily API 密钥。`,
        source: 'example.com',
        score: 0.9,
        category
      },
      {
        id: `mock-${Date.now()}-2`,
        title: `${query} - 相关结果 2`,
        url: 'https://example.com/result2',
        snippet: `另一个关于 "${query}" 的模拟搜索结果。请在环境变量中配置 VITE_TAVILY_API_KEY。`,
        source: 'example.com',
        score: 0.8,
        category
      }
    ];

    return mockResults;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const webSearchService = new WebSearchService();
export default WebSearchService;
