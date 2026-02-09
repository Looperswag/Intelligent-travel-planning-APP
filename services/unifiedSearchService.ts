/**
 * Unified Search Service
 *
 * Provides a unified interface for all search operations:
 * - Web search (Tavily)
 * - POI search (Amap)
 * - Image search (Unsplash, Pexels, Pixabay)
 * - Intent-based search routing
 */

import { WebSearchOptions, WebSearchResult, SearchCategory, POI } from '../types';
import { webSearchService } from './webSearchService';
import { AmapService } from './amapService';
import { imageService } from './imageService';

export interface UnifiedSearchOptions extends WebSearchOptions {
  sources?: ('web' | 'poi' | 'image')[];
  maxImages?: number;
}

export interface UnifiedSearchResult {
  webResults?: WebSearchResult[];
  poiResults?: POI[];
  imageResults?: string[];
}

/**
 * Unified search service that aggregates results from multiple sources
 */
class UnifiedSearchService {
  /**
   * Perform search across multiple sources
   */
  public async search(options: UnifiedSearchOptions): Promise<UnifiedSearchResult> {
    const {
      sources = ['web', 'poi'],
      query,
      category,
      location,
      maxResults,
      maxImages = 5
    } = options;

    const results: UnifiedSearchResult = {};
    const searchPromises: Promise<void>[] = [];

    // Web search
    if (sources.includes('web')) {
      searchPromises.push(
        this.performWebSearch(query, category, location, maxResults)
          .then(webResults => {
            results.webResults = webResults;
          })
      );
    }

    // POI search (for attraction, restaurant categories)
    if (sources.includes('poi') && (category === 'attraction' || category === 'restaurant' || category === 'general')) {
      searchPromises.push(
        this.performPoiSearch(query, location)
          .then(poiResults => {
            results.poiResults = poiResults;
          })
      );
    }

    // Image search
    if (sources.includes('image')) {
      searchPromises.push(
        this.performImageSearch(query, maxImages)
          .then(imageResults => {
            results.imageResults = imageResults;
          })
      );
    }

    // Wait for all searches to complete
    await Promise.all(searchPromises);

    return results;
  }

  /**
   * Perform web search
   */
  private async performWebSearch(
    query: string,
    category?: SearchCategory,
    location?: string,
    maxResults?: number
  ): Promise<WebSearchResult[]> {
    return await webSearchService.search({
      query,
      category,
      location,
      maxResults
    });
  }

  /**
   * Perform POI search using Amap
   */
  private async performPoiSearch(query: string, location?: string): Promise<POI[]> {
    try {
      const result = await AmapService.searchPlace(query, location || '');

      if (result) {
        // Convert Amap result to POI format
        const poi: POI = {
          id: result.id || `amap-${Date.now()}`,
          name: result.name,
          nameEn: result.nameEn,
          address: result.address || '',
          lat: result.lat || 0,
          lng: result.lng || 0,
          category: result.category || 'unknown',
          rating: result.rating,
          tel: result.tel,
          images: result.images || [],
          tags: result.tags || []
        };

        return [poi];
      }

      return [];
    } catch (error) {
      console.error('POI search failed:', error);
      return [];
    }
  }

  /**
   * Perform image search
   */
  private async performImageSearch(query: string, maxImages: number): Promise<string[]> {
    try {
      const images = await imageService.searchImages(query, maxImages);
      return images;
    } catch (error) {
      console.error('Image search failed:', error);
      return [];
    }
  }

  /**
   * Smart search that automatically determines the best sources
   */
  public async smartSearch(query: string, category: SearchCategory, location?: string): Promise<UnifiedSearchResult> {
    let sources: ('web' | 'poi' | 'image')[] = ['web'];

    // Determine relevant sources based on category
    switch (category) {
      case 'attraction':
        sources = ['web', 'poi', 'image'];
        break;
      case 'restaurant':
        sources = ['web', 'poi'];
        break;
      case 'accommodation':
        sources = ['web', 'image'];
        break;
      case 'activity':
        sources = ['web', 'image'];
        break;
      case 'general':
        sources = ['web', 'poi'];
        break;
    }

    return this.search({
      query,
      category,
      location,
      sources
    });
  }

  /**
   * Batch search for multiple queries
   */
  public async batchSearch(queries: string[], category: SearchCategory, location?: string): Promise<Map<string, UnifiedSearchResult>> {
    const results = new Map<string, UnifiedSearchResult>();

    await Promise.all(
      queries.map(async query => {
        const result = await this.smartSearch(query, category, location);
        results.set(query, result);
      })
    );

    return results;
  }
}

// Export singleton instance
export const unifiedSearchService = new UnifiedSearchService();
export default UnifiedSearchService;
