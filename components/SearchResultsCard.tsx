import React, { useState } from 'react';
import { MapPin, Star, Navigation, Loader2, X, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchResult, WebSearchResult, POI } from '../types';

interface SearchResultsCardProps {
  results?: SearchResult[];
  webResults?: WebSearchResult[];
  poiResults?: POI[];
  onAddToItinerary?: (result: SearchResult | POI) => void;
  onRetry?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export const SearchResultsCard: React.FC<SearchResultsCardProps> = ({
  results,
  webResults,
  poiResults,
  onAddToItinerary,
  onRetry,
  onClose,
  isLoading = false,
  pagination
}) => {
  const [activeTab, setActiveTab] = useState<'poi' | 'web'>('poi');

  // Combine results for display
  const allPoiResults = poiResults || (results as POI[]) || [];
  const allWebResults = webResults || [];

  const hasResults = allPoiResults.length > 0 || allWebResults.length > 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-morandi-base shadow-lg">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 size={20} className="animate-spin text-morandi-sage" />
          <span className="text-sm text-morandi-slate">正在搜索...</span>
        </div>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-morandi-base shadow-lg">
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-morandi-base rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin size={20} className="text-morandi-dust" />
          </div>
          <p className="text-sm text-morandi-slate">未找到相关结果</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-morandi-base text-morandi-slate
                         rounded-lg text-sm hover:bg-morandi-clay/50 transition-all"
            >
              重新搜索
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-morandi-base shadow-lg overflow-hidden">
      {/* Header with tabs */}
      <div className="px-4 py-3 border-b border-morandi-base bg-morandi-base/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-morandi-sage" />
            <span className="text-sm font-medium text-morandi-charcoal">
              找到 {allPoiResults.length + allWebResults.length} 个结果
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-morandi-base rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-morandi-sage"
              aria-label="关闭"
            >
              <X size={16} className="text-morandi-slate" />
            </button>
          )}
        </div>

        {/* Tabs for multi-source results */}
        {allWebResults.length > 0 && allPoiResults.length > 0 && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setActiveTab('poi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer focus:outline-none ${
                activeTab === 'poi'
                  ? 'bg-morandi-sage text-white'
                  : 'bg-morandi-base text-morandi-slate hover:bg-morandi-clay/50'
              }`}
            >
              地点 ({allPoiResults.length})
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer focus:outline-none ${
                activeTab === 'web'
                  ? 'bg-morandi-sage text-white'
                  : 'bg-morandi-base text-morandi-slate hover:bg-morandi-clay/50'
              }`}
            >
              网页 ({allWebResults.length})
            </button>
          </div>
        )}
      </div>

      {/* Results list */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {activeTab === 'poi' && allPoiResults.map((result, index) => renderPoiResult(result, index, onAddToItinerary))}
        {activeTab === 'web' && allWebResults.map((result, index) => renderWebResult(result, index))}
          <div
            key={result.id || index}
            className="p-4 border-b border-morandi-base/50 last:border-b-0
                           hover:bg-morandi-base/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              {/* Icon/Info */}
              <div className="w-10 h-10 bg-morandi-base rounded-lg flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-morandi-sage" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-morandi-charcoal text-sm truncate">
                    {result.name}
                  </h4>
                  {result.rating && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-morandi-slate">{result.rating}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-morandi-slate truncate mb-1">
                  {result.address}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1
                               px-2 py-0.5 bg-morandi-base rounded-full
                               text-xs text-morandi-slate">
                    {result.category}
                  </span>
                  {result.distance && (
                    <span className="text-xs text-morandi-dust">
                      {result.distance}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {onAddToItinerary && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onAddToItinerary(result)}
                    className="px-3 py-1.5 bg-morandi-sage text-white rounded-lg
                               text-xs font-medium hover:bg-morandi-charcoal
                               transition-all whitespace-nowrap"
                  >
                    添加到行程
                  </button>
                  {result.lat && result.lng && (
                    <a
                      href={`https://www.amap.com/search?query=${encodeURIComponent(result.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-morandi-base text-morandi-slate rounded-lg
                                 text-xs font-medium hover:bg-morandi-clay/50
                                 transition-all whitespace-nowrap flex items-center gap-1"
                    >
                      <Navigation size={12} />
                      导航
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-morandi-base flex items-center justify-center gap-2">
          <button
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="p-2 rounded-lg bg-morandi-base text-morandi-slate hover:bg-morandi-clay/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-morandi-sage"
            aria-label="上一页"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-morandi-slate">
            {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="p-2 rounded-lg bg-morandi-base text-morandi-slate hover:bg-morandi-clay/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-morandi-sage"
            aria-label="下一页"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Footer actions */}
      <div className="p-3 bg-morandi-base/20 border-t border-morandi-base flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 bg-morandi-base text-morandi-slate
                       rounded-lg text-sm hover:bg-morandi-clay/50
                       transition-all font-medium"
          >
            换一批结果
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white text-morandi-slate border border-morandi-base
                       rounded-lg text-sm hover:bg-morandi-base
                       transition-all font-medium"
          >
            关闭
          </button>
        )}
      </div>
    </div>
  );
};

// Helper function to render POI results
function renderPoiResult(
  result: POI,
  index: number,
  onAddToItinerary?: (result: POI) => void
) {
  return (
    <div
      key={result.id || index}
      className="p-4 border-b border-morandi-base/50 last:border-b-0
                     hover:bg-morandi-base/30 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-morandi-base rounded-lg flex items-center justify-center shrink-0">
          <MapPin size={18} className="text-morandi-sage" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-bold text-morandi-charcoal text-sm truncate">
              {result.name}
            </h4>
            {result.rating && (
              <div className="flex items-center gap-1 shrink-0">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-morandi-slate">{result.rating}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-morandi-slate truncate mb-1">
            {result.address}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1
                         px-2 py-0.5 bg-morandi-base rounded-full
                         text-xs text-morandi-slate">
              {result.category}
            </span>
            {result.tags && result.tags.length > 0 && (
              <span className="text-xs text-morandi-dust truncate">
                {result.tags.slice(0, 2).join('、')}
              </span>
            )}
          </div>
        </div>

        {onAddToItinerary && (
          <button
            onClick={() => onAddToItinerary(result)}
            className="px-3 py-1.5 bg-morandi-sage text-white rounded-lg
                       text-xs font-medium hover:bg-morandi-charcoal
                       transition-all whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-morandi-sage"
          >
            添加到行程
          </button>
        )}
      </div>
    </div>
  );
}

// Helper function to render web results
function renderWebResult(result: WebSearchResult, index: number) {
  return (
    <a
      key={result.id || index}
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border-b border-morandi-base/50 last:border-b-0
                hover:bg-morandi-base/30 transition-colors group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-morandi-base rounded-lg flex items-center justify-center shrink-0">
          <Globe size={18} className="text-morandi-sage" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-bold text-morandi-charcoal text-sm truncate group-hover:text-blue-600 transition-colors">
              {result.title}
            </h4>
            {result.score && (
              <span className="text-xs text-morandi-dust shrink-0">
                {Math.round(result.score * 100)}%
              </span>
            )}
          </div>

          <p className="text-xs text-morandi-slate line-clamp-2 mb-1">
            {result.snippet}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1
                         px-2 py-0.5 bg-morandi-base rounded-full
                         text-xs text-morandi-slate">
              {result.source}
            </span>
            {result.category && (
              <span className="text-xs text-morandi-dust">
                {result.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

// Inline message version for chat
interface SearchResultsMessageProps {
  results: SearchResult[];
  onAddToItinerary: (result: SearchResult) => void;
  onRetry: () => void;
}

export const SearchResultsMessage: React.FC<SearchResultsMessageProps> = ({
  results,
  onAddToItinerary,
  onRetry
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-morandi-base shadow-md max-w-md">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-morandi-base/50">
        <MapPin size={16} className="text-morandi-sage" />
        <span className="text-sm font-medium text-morandi-charcoal">
          为您找到 {results.length} 个结果
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar mb-3">
        {results.slice(0, 3).map((result, index) => (
          <div
            key={result.id || index}
            className="p-3 bg-morandi-base/30 rounded-lg hover:bg-morandi-base/50
                           transition-colors cursor-pointer group"
            onClick={() => onAddToItinerary(result)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-morandi-charcoal text-sm truncate">
                  {result.name}
                </h5>
                <p className="text-xs text-morandi-slate truncate">
                  {result.address}
                </p>
              </div>
              {result.rating && (
                <div className="flex items-center gap-1 shrink-0">
                  <Star size={10} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-morandi-slate">{result.rating}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {results.length > 3 && (
          <div className="text-center py-2">
            <span className="text-xs text-morandi-dust">
              还有 {results.length - 3} 个结果...
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="flex-1 py-2 bg-morandi-base text-morandi-slate
                     rounded-lg text-xs hover:bg-morandi-clay/50 transition-all"
        >
          换一批
        </button>
        <button
          onClick={() => {/* TODO: show all results */}}
          className="flex-1 py-2 bg-morandi-charcoal text-white
                     rounded-lg text-xs hover:bg-black transition-all"
        >
          查看全部
        </button>
      </div>
    </div>
  );
};
