/**
 * Search Agent
 *
 * Orchestrates search operations with intelligent result filtering,
 * ranking, and caching. Integrates with the intent system for
 * smart search routing.
 */

import { SearchCategory, WebSearchResult, POI } from '../../types';
import { unifiedSearchService, UnifiedSearchResult } from '../unifiedSearchService';

export interface SearchAgentOptions {
  query: string;
  category?: SearchCategory;
  location?: string;
  context?: string; // Additional context for better results
  maxResults?: number;
}

export interface RankedSearchResult {
  result: WebSearchResult | POI;
  score: number;
  relevance: 'high' | 'medium' | 'low';
  reason: string;
}

export interface SearchAgentResponse {
  query: string;
  category: SearchCategory;
  results: RankedSearchResult[];
  totalCount: number;
  searchTime: number;
  suggestions?: string[];
}

/**
 * Search Agent for intelligent search orchestration
 */
class SearchAgent {
  /**
   * Perform intelligent search with ranking and filtering
   */
  public async search(options: SearchAgentOptions): Promise<SearchAgentResponse> {
    const startTime = Date.now();
    const {
      query,
      category = 'general',
      location,
      context,
      maxResults = 10
    } = options;

    // Perform unified search
    const searchResults: UnifiedSearchResult = await unifiedSearchService.smartSearch(
      query,
      category,
      location
    );

    // Combine and rank results
    const rankedResults = this.rankResults(
      searchResults,
      query,
      category,
      context
    );

    // Filter to max results
    const topResults = rankedResults.slice(0, maxResults);

    // Generate search suggestions
    const suggestions = this.generateSuggestions(query, category);

    return {
      query,
      category,
      results: topResults,
      totalCount: rankedResults.length,
      searchTime: Date.now() - startTime,
      suggestions
    };
  }

  /**
   * Rank search results by relevance
   */
  private rankResults(
    searchResults: UnifiedSearchResult,
    query: string,
    category: SearchCategory,
    context?: string
  ): RankedSearchResult[] {
    const ranked: RankedSearchResult[] = [];

    // Process web results
    if (searchResults.webResults) {
      searchResults.webResults.forEach(result => {
        const score = this.calculateRelevanceScore(result, query, category, context);
        ranked.push({
          result,
          score,
          relevance: this.getRelevanceLevel(score),
          reason: this.getRelevanceReason(result, query)
        });
      });
    }

    // Process POI results
    if (searchResults.poiResults) {
      searchResults.poiResults.forEach(result => {
        const score = this.calculatePoiRelevanceScore(result, query, category);
        ranked.push({
          result,
          score,
          relevance: this.getRelevanceLevel(score),
          reason: this.getRelevanceReason(result, query)
        });
      });
    }

    // Sort by score descending
    ranked.sort((a, b) => b.score - a.score);

    return ranked;
  }

  /**
   * Calculate relevance score for web results
   */
  private calculateRelevanceScore(
    result: WebSearchResult,
    query: string,
    category: SearchCategory,
    context?: string
  ): number {
    let score = result.score || 0.5;

    // Boost for query match in title
    if (result.title.toLowerCase().includes(query.toLowerCase())) {
      score += 0.3;
    }

    // Boost for category match
    if (result.category === category) {
      score += 0.2;
    }

    // Boost for context match
    if (context && result.snippet.toLowerCase().includes(context.toLowerCase())) {
      score += 0.1;
    }

    // Boost for recent content
    if (result.publishedDate) {
      const publishDate = new Date(result.publishedDate);
      const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublish < 30) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate relevance score for POI results
   */
  private calculatePoiRelevanceScore(
    result: POI,
    query: string,
    category: SearchCategory
  ): number {
    let score = 0.5;

    // Boost for name match
    if (result.name.toLowerCase().includes(query.toLowerCase())) {
      score += 0.4;
    }

    // Boost for rating
    if (result.rating && result.rating >= 4.0) {
      score += 0.2;
    }

    // Boost for category match
    if (result.category.toLowerCase().includes(category.toLowerCase())) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get relevance level from score
   */
  private getRelevanceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Get relevance reason for display
   */
  private getRelevanceReason(result: WebSearchResult | POI, query: string): string {
    if ('title' in result) {
      if (result.title.toLowerCase().includes(query.toLowerCase())) {
        return '标题匹配';
      }
    } else {
      if (result.name.toLowerCase().includes(query.toLowerCase())) {
        return '名称匹配';
      }
    }
    return '相关内容';
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string, category: SearchCategory): string[] {
    const suggestions: string[] = [];

    // Add category-specific suggestions
    switch (category) {
      case 'restaurant':
        suggestions.push(`${query} 附近美食`, `${query} 推荐`, `${query} 人均消费`);
        break;
      case 'attraction':
        suggestions.push(`${query} 景点门票`, `${query} 开放时间`, `${query} 游玩攻略`);
        break;
      case 'accommodation':
        suggestions.push(`${query} 附近酒店`, `${query} 民宿推荐`, `${query} 住宿价格`);
        break;
      default:
        suggestions.push(`${query} 攻略`, `${query} 推荐`, `${query} 评价`);
    }

    return suggestions;
  }

  /**
   * Format search results for chat display
   */
  public formatForChat(response: SearchAgentResponse): string {
    const { results, totalCount, suggestions } = response;

    let output = `为您找到 ${totalCount} 个结果：\n\n`;

    results.forEach((ranked, index) => {
      const { result, relevance, reason } = ranked;
      const emoji = relevance === 'high' ? '🔥' : relevance === 'medium' ? '⭐' : '📍';

      if ('title' in result) {
        output += `${emoji} ${result.title}\n`;
        output += `   ${result.snippet}\n`;
        output += `   ${reason} | 来源: ${result.source}\n\n`;
      } else {
        output += `${emoji} ${result.name}\n`;
        output += `   ${result.address}\n`;
        if (result.rating) {
          output += `   评分: ${result.rating}★ | ${reason}\n\n`;
        }
      }
    });

    if (suggestions && suggestions.length > 0) {
      output += `\n💡 建议搜索：\n${suggestions.map(s => `• ${s}`).join('\n')}`;
    }

    return output;
  }
}

// Export singleton instance
export const searchAgent = new SearchAgent();
export default SearchAgent;
