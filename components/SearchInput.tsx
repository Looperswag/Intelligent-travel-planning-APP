/**
 * SearchInput Component
 *
 * Enhanced search input with autocomplete, history support,
 * and category selection.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, ChevronDown } from 'lucide-react';
import { SearchCategory, SearchHistoryEntry } from '../types';

interface SearchInputProps {
  onSearch: (query: string, category: SearchCategory) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  history?: SearchHistoryEntry[];
  categories?: { label: string; value: SearchCategory }[];
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  placeholder = '搜索景点、餐厅、酒店...',
  disabled = false,
  loading = false,
  history = [],
  categories = [
    { label: '全部', value: 'general' },
    { label: '景点', value: 'attraction' },
    { label: '餐厅', value: 'restaurant' },
    { label: '酒店', value: 'accommodation' },
    { label: '活动', value: 'activity' }
  ]
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('general');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled && !loading) {
      onSearch(query.trim(), selectedCategory);
      setQuery('');
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (entry: SearchHistoryEntry) => {
    setQuery(entry.query);
    setSelectedCategory(entry.category);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showHistory && history.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < history.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        handleHistoryClick(history[highlightedIndex]);
      }
    }
  };

  const currentCategory = categories.find(c => c.value === selectedCategory);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Category Selector */}
        <button
          type="button"
          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          disabled={disabled}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer text-sm text-slate-600 disabled:opacity-50"
          aria-label="选择搜索类别"
        >
          {currentCategory?.label}
          <ChevronDown size={14} />
        </button>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowHistory(e.target.value === '' && history.length > 0);
          }}
          onFocus={() => setShowHistory(query === '' && history.length > 0)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-28 pr-24 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
          aria-label="搜索输入"
          aria-describedby="search-description"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="清除输入"
          >
            <X size={16} />
          </button>
        )}

        {/* Search Button */}
        <button
          type="submit"
          disabled={!query.trim() || disabled || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="搜索"
          aria-busy={loading}
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Search size={16} />
          )}
        </button>
      </form>

      {/* Category Dropdown */}
      {showCategoryDropdown && (
        <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden animate-fade-in">
          {categories.map(category => (
            <button
              key={category.value}
              type="button"
              onClick={() => {
                setSelectedCategory(category.value);
                setShowCategoryDropdown(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus:bg-slate-50 ${
                selectedCategory === category.value ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      {/* Search History Dropdown */}
      {showHistory && history.length > 0 && !showCategoryDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden animate-fade-in">
          <div className="px-4 py-2 border-b border-slate-100">
            <span className="text-xs text-slate-500">搜索历史</span>
          </div>
          {history.slice(0, 5).map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleHistoryClick(entry)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus:bg-slate-50 ${
                highlightedIndex === index ? 'bg-slate-50' : ''
              }`}
            >
              <Clock size={14} className="text-slate-400" />
              <span className="flex-1 text-left text-sm text-slate-700">{entry.query}</span>
              <span className="text-xs text-slate-400">{entry.resultCount} 结果</span>
            </button>
          ))}
        </div>
      )}

      {/* Screen reader description */}
      <span id="search-description" className="sr-only">
        输入搜索关键词，选择类别后点击搜索按钮或按回车键搜索
      </span>
    </div>
  );
};

export default SearchInput;
