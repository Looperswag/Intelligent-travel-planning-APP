import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, MessageSquarePlus } from 'lucide-react';

interface FollowUpInputProps {
  initialPrompt: string;
  onSubmit: (followUpInput: string) => Promise<void>;
  isAnalyzing: boolean;
  isRegenerating: boolean;
}

export const FollowUpInput: React.FC<FollowUpInputProps> = ({
  initialPrompt,
  onSubmit,
  isAnalyzing,
  isRegenerating
}) => {
  const [followUpInput, setFollowUpInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [followUpInput]);

  const handleSubmit = async () => {
    if (!followUpInput.trim() || isAnalyzing || isRegenerating) return;
    await onSubmit(followUpInput);
    setFollowUpInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-6 animate-slide-up">
      <div className={`
        max-w-3xl mx-auto p-6 rounded-3xl shadow-float border
        transition-all duration-300
        ${isFocused ? 'ring-2 ring-morandi-sage/30 shadow-glow scale-[1.01]' : ''}
        bg-morandi-base/80 backdrop-blur-xl
        border-white/50
      `}>
        {/* Initial Input Display */}
        <div className="mb-4 pb-4 border-b border-morandi-clay/50">
          <div className="flex items-start gap-2 text-sm text-morandi-slate">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-morandi-accent" />
            <div className="line-clamp-2 opacity-80 font-light">
              {initialPrompt}
            </div>
          </div>
        </div>

        {/* Follow-up Input Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="添加新的想法或调整建议... (Shift+Enter 换行)"
            className="w-full bg-transparent border-0 focus:ring-0
                       text-morandi-charcoal placeholder-morandi-dust
                       resize-none text-base leading-relaxed
                       min-h-[60px] max-h-[200px]
                       font-light"
            disabled={isAnalyzing || isRegenerating}
          />

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!followUpInput.trim() || isAnalyzing || isRegenerating}
            className={`
              absolute bottom-2 right-2 p-3 rounded-xl
              transition-all duration-200
              ${followUpInput.trim() && !isAnalyzing && !isRegenerating
                ? 'bg-morandi-charcoal text-white hover:bg-morandi-slate hover:scale-105 shadow-md cursor-pointer'
                : 'bg-morandi-dust text-morandi-slate cursor-not-allowed opacity-60'}
            `}
          >
            {isAnalyzing || isRegenerating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        {/* Helper Text */}
        <div className="mt-3 flex items-center justify-between text-xs text-morandi-dust">
          <div className="flex items-center gap-1.5">
            <MessageSquarePlus size={12} />
            <span>您可以询问行程细节、调整安排或重新规划</span>
          </div>
          <span>按 Enter 发送</span>
        </div>
      </div>
    </div>
  );
};
