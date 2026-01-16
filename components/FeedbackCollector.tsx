/**
 * FeedbackCollector - 反馈收集组件
 *
 * 功能：
 * 1. 收集用户对行程的反馈
 * 2. 支持快速反馈标签
 * 3. 支持详细文字反馈
 * 4. 显示反馈历史
 */

import React, { useState } from 'react';
import { UserFeedback, FeedbackType } from '../types';
import {
  ThumbsUp,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  Send,
  X
} from 'lucide-react';

interface FeedbackCollectorProps {
  targetDay?: number;
  onSubmit: (feedback: Omit<UserFeedback, 'id' | 'timestamp' | 'status'>) => void;
  onClose?: () => void;
}

// 快速反馈选项
const QUICK_FEEDBACKS = [
  { type: FeedbackType.APPROVAL, label: '很满意', icon: ThumbsUp, color: 'green' },
  { type: FeedbackType.SUGGESTION, label: '有建议', icon: Lightbulb, color: 'blue' },
  { type: FeedbackType.OBJECTION, label: '有异议', icon: AlertTriangle, color: 'orange' },
  { type: FeedbackType.QUESTION, label: '有疑问', icon: MessageSquare, color: 'purple' }
];

export const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({
  targetDay,
  onSubmit,
  onClose
}) => {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!selectedType || !content.trim()) return;

    onSubmit({
      type: selectedType,
      targetDay,
      content: content.trim(),
      author: '当前用户'
    });

    // 重置表单
    setSelectedType(null);
    setContent('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">
          {targetDay ? `对 Day ${targetDay} 的反馈` : '对行程的反馈'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* 快速反馈类型选择 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            您对这部分行程的看法？
          </label>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_FEEDBACKS.map((feedback) => {
              const Icon = feedback.icon;
              const isSelected = selectedType === feedback.type;

              return (
                <button
                  key={feedback.type}
                  onClick={() => setSelectedType(feedback.type)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200
                    ${isSelected
                      ? `bg-${feedback.color}-100 ring-2 ring-${feedback.color}-400`
                      : 'bg-slate-100 hover:bg-slate-200'
                    }
                  `}
                >
                  <Icon
                    size={20}
                    className={isSelected ? `text-${feedback.color}-600` : 'text-slate-600'}
                  />
                  <span className={`text-xs font-medium ${
                    isSelected ? `text-${feedback.color}-900` : 'text-slate-600'
                  }`}>
                    {feedback.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 详细反馈内容 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            请详细说明您的想法
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="比如：这个景点太远了，能不能换个近一点的？"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-sm"
            rows={4}
          />
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!selectedType || !content.trim()}
          className={`
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all duration-200
            ${!selectedType || !content.trim()
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:scale-[1.02]'
            }
          `}
        >
          <Send size={18} />
          提交反馈
        </button>

        {/* 提示信息 */}
        <div className="text-center text-xs text-slate-500">
          💡 您的反馈将帮助AI优化行程建议
        </div>
      </div>
    </div>
  );
};

export default FeedbackCollector;
