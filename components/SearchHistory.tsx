/**
 * SearchHistory Component
 *
 * Displays search history with filtering and management options.
 */

import React, { useState } from 'react';
import { Clock, Trash2, Search } from 'lucide-react';
import { SearchHistoryEntry, SearchCategory } from '../types';

interface SearchHistoryProps {
  history: SearchHistoryEntry[];
  onSearch: (query: string, category: SearchCategory) => void;
  onClear?: () => void;
  onDelete?: (id: string) => void;
  maxItems?: number;
}

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  general: '全部',
  attraction: '景点',
  restaurant: '餐厅',
  accommodation: '酒店',
  transport: '交通',
  activity: '活动'
};

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSearch,
  onClear,
  onDelete,
  maxItems = 10
}) => {
  const [filterCategory, setFilterCategory] = useState<SearchCategory | 'all'>('all');
  const [expanded, setExpanded] = useState(false);

  const filteredHistory = history
    .filter(entry => filterCategory === 'all' || entry.category === filterCategory)
    .slice(0, expanded ? undefined : maxItems);

  const hasHistory = filteredHistory.length > 0;

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;

    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  if (!hasHistory) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">暂无搜索历史</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">搜索历史</h3>
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as SearchCategory | 'all')}
            className="px-3 py-1.5 text-sm bg-slate-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            aria-label="按类别筛选"
          >
            <option value="all">全部类别</option>
            {(Object.entries(CATEGORY_LABELS) as [SearchCategory, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Clear All */}
          {onClear && (
            <button
              onClick={onClear}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              aria-label="清空搜索历史"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2">
        {filteredHistory.map(entry => (
          <div
            key={entry.id}
            className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
          >
            {/* Search Icon */}
            <button
              onClick={() => onSearch(entry.query, entry.category)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`搜索: ${entry.query}`}
            >
              <Search size={16} />
            </button>

            {/* Query Info */}
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onSearch(entry.query, entry.category)}
                className="w-full text-left focus:outline-none"
              >
                <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                  {entry.query}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">
                    {CATEGORY_LABELS[entry.category]}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-400">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-400">
                    {entry.resultCount} 结果
                  </span>
                </div>
              </button>
            </div>

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 opacity-0 group-hover:opacity-100"
                aria-label={`删除: ${entry.query}`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Show More */}
      {history.length > maxItems && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors cursor-pointer focus:outline-none focus:underline"
        >
          显示更多 ({history.length - maxItems} 条)
        </button>
      )}
    </div>
  );
};

export default SearchHistory;
