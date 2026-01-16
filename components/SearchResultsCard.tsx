import React from 'react';
import { MapPin, Star, Navigation, Loader2, X } from 'lucide-react';
import { SearchResult } from '../types';

interface SearchResultsCardProps {
  results: SearchResult[];
  onAddToItinerary?: (result: SearchResult) => void;
  onRetry?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export const SearchResultsCard: React.FC<SearchResultsCardProps> = ({
  results,
  onAddToItinerary,
  onRetry,
  onClose,
  isLoading = false
}) => {
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

  if (results.length === 0) {
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
      {/* Header */}
      <div className="px-4 py-3 border-b border-morandi-base flex items-center justify-between bg-morandi-base/30">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-morandi-sage" />
          <span className="text-sm font-medium text-morandi-charcoal">
            找到 {results.length} 个结果
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-morandi-base rounded-full transition-colors"
          >
            <X size={16} className="text-morandi-slate" />
          </button>
        )}
      </div>

      {/* Results list */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {results.map((result, index) => (
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
