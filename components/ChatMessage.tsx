import React, { useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';

interface ChatMessageProps {
  userQuery: string;
  aiReply: string;
  suggestions?: string[];
  onClose: () => void;
  onSuggestionClick: (suggestion: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  userQuery,
  aiReply,
  suggestions = [],
  onClose,
  onSuggestionClick
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/20 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-morandi-charcoal/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-morandi-slate/30 w-full max-w-md max-h-[70vh] flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-morandi-slate/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-morandi-sage animate-pulse"></div>
            <span className="text-sm font-medium text-morandi-base">AI 旅行顾问</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-morandi-slate/20 rounded-full transition-colors text-morandi-dust hover:text-morandi-base"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
        >
          {/* User Message */}
          <div className="flex justify-end animate-slide-up">
            <div className="max-w-[80%] bg-morandi-sage text-white px-4 py-3 rounded-2xl rounded-br-md shadow-md">
              <p className="text-sm leading-relaxed">{userQuery}</p>
            </div>
          </div>

          {/* AI Message */}
          <div className="flex justify-start animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="max-w-[80%] bg-morandi-slate/20 text-morandi-base px-4 py-3 rounded-2xl rounded-bl-md">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiReply}</p>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="pt-4 space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xs text-morandi-dust px-1">点击建议快速发送：</p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 bg-morandi-base/80 hover:bg-morandi-base border border-morandi-sage/30 hover:border-morandi-sage/50 rounded-xl text-sm text-morandi-charcoal transition-all duration-200 group flex items-center justify-between"
                >
                  <span>{suggestion}</span>
                  <Send size={14} className="text-morandi-sage opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-morandi-slate/10 border-t border-morandi-slate/30">
          <p className="text-xs text-morandi-dust text-center">
            点击建议或关闭弹窗继续使用
          </p>
        </div>
      </div>
    </div>
  );
};
