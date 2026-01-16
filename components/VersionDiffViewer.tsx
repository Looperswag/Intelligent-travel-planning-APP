/**
 * VersionDiffViewer - 版本对比组件
 *
 * 功能：
 * 1. 对比两个版本之间的差异
 * 2. 显示新增、删除、修改的内容
 * 3. 支持版本回滚
 */

import React, { useState } from 'react';
import { VersionHistory } from '../types';
import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';

interface VersionDiffViewerProps {
  currentVersion: VersionHistory;
  previousVersion?: VersionHistory | null;
  onRestore?: (version: VersionHistory) => void;
}

export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  currentVersion,
  previousVersion,
  onRestore
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  if (!previousVersion) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>这是初始版本，没有历史对比</p>
      </div>
    );
  }

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // 简化的差异分析
  const changes = currentVersion.changes;
  const previousChanges = previousVersion.changes;

  const diffItems = changes.map((change, index) => {
    const prevChange = previousChanges.find(c => c.day === change.day && c.type === change.type);

    if (!prevChange) {
      // 新增
      return { ...change, diffType: 'added', index };
    } else if (prevChange.description !== change.description) {
      // 修改
      return { ...change, diffType: 'modified', index, previousDescription: prevChange.description };
    } else {
      return { ...change, diffType: 'unchanged', index };
    }
  });

  // 找出被删除的变更
  const removedItems = previousChanges
    .filter(prevChange => !changes.some(c => c.day === prevChange.day && c.type === prevChange.type))
    .map((change, index) => ({ ...change, diffType: 'removed', index: changes.length + index }));

  const allItems = [...diffItems, ...removedItems];

  return (
    <div className="space-y-4">
      {/* 版本信息头 */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            <span className="font-medium">版本 {previousVersion.version}</span>
            <span className="mx-2">→</span>
            <span className="font-bold text-blue-600">版本 {currentVersion.version}</span>
          </div>
          <div className="text-xs text-slate-500">
            {new Date(currentVersion.timestamp).toLocaleString('zh-CN')}
          </div>
        </div>

        {onRestore && (
          <button
            onClick={() => onRestore(previousVersion)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm transition-colors"
          >
            <RotateCcw size={14} />
            回滚到 V{previousVersion.version}
          </button>
        )}
      </div>

      {/* 差异列表 */}
      <div className="space-y-2">
        {allItems.map((item: any) => {
          const isExpanded = expandedItems.has(item.index);

          return (
            <div
              key={item.index}
              className={`border rounded-xl overflow-hidden ${
                item.diffType === 'added'
                  ? 'border-green-200 bg-green-50'
                  : item.diffType === 'removed'
                  ? 'border-red-200 bg-red-50'
                  : item.diffType === 'modified'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <button
                onClick={() => toggleExpand(item.index)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* 差异类型图标 */}
                  {item.diffType === 'added' && (
                    <span className="text-green-600 font-medium text-sm">+ 新增</span>
                  )}
                  {item.diffType === 'removed' && (
                    <span className="text-red-600 font-medium text-sm">- 删除</span>
                  )}
                  {item.diffType === 'modified' && (
                    <span className="text-blue-600 font-medium text-sm">~ 修改</span>
                  )}

                  {/* 变更描述 */}
                  <span className={`font-medium ${
                    item.diffType === 'removed' ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}>
                    {item.description}
                  </span>

                  {/* 作用范围 */}
                  {item.type === 'local' && item.day && (
                    <span className="text-xs px-2 py-0.5 bg-slate-200 rounded-full text-slate-600">
                      Day {item.day}
                    </span>
                  )}
                  {item.type === 'global' && (
                    <span className="text-xs px-2 py-0.5 bg-purple-200 rounded-full text-purple-600">
                      全局
                    </span>
                  )}
                </div>

                {/* 展开/收起图标 */}
                {item.diffType === 'modified' && (
                  isExpanded ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )
                )}
              </button>

              {/* 修改详情（仅修改类型显示） */}
              {item.diffType === 'modified' && isExpanded && (
                <div className="px-3 pb-3 border-t border-slate-200 pt-2">
                  <div className="text-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 line-through">{item.previousDescription}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-medium">{item.description}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 text-xs text-slate-600 pt-2">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded"></span>
          新增
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded"></span>
          删除
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded"></span>
          修改
        </span>
      </div>
    </div>
  );
};

export default VersionDiffViewer;
