import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { TripSkeleton, ChatMessage } from '../types';

interface ReportChatPanelProps {
  initialPrompt: string;
  tripSkeleton: TripSkeleton | null;
  onSubmit: (input: string) => Promise<void>;
  isAnalyzing: boolean;
  isRegenerating: boolean;
}

export const ReportChatPanel: React.FC<ReportChatPanelProps> = ({
  initialPrompt,
  tripSkeleton: _tripSkeleton,
  onSubmit,
  isAnalyzing,
  isRegenerating
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isAnalyzing || isRegenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    try {
      await onSubmit(currentInput);
    } catch (error) {
      // If error occurs, show error message and restore input
      setInput(currentInput);
      setMessages(prev => [...prev.slice(0, -1)]);
      console.error('Submit failed:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Glassmorphism container */}
        <div className="bg-morandi-base/80 backdrop-blur-xl rounded-3xl
                    shadow-float border border-white/50
                    transition-all duration-300">

          {/* Chat messages area (expandable) */}
          {messages.length > 0 && (
            <div className="max-h-[400px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-morandi-sage text-white rounded-br-md shadow-md'
                      : 'bg-morandi-slate/20 text-morandi-charcoal rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Initial prompt display */}
          <div className="px-6 py-4 border-b border-morandi-clay/50">
            <div className="flex items-start gap-2 text-sm text-morandi-slate">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-morandi-accent" />
              <div className="line-clamp-2 opacity-80 font-light">
                {initialPrompt}
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="p-6">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="添加新的想法或调整建议... (Shift+Enter 换行)"
                className="w-full bg-transparent border-0 focus:ring-0
                           text-morandi-charcoal placeholder-morandi-dust
                           resize-none text-base leading-relaxed
                           min-h-[60px] max-h-[200px]"
                disabled={isAnalyzing || isRegenerating}
                rows={1}
              />

              {/* Send button */}
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isAnalyzing || isRegenerating}
                className="absolute bottom-2 right-2 p-3 rounded-xl
                           bg-morandi-charcoal text-white
                           hover:bg-morandi-slate hover:scale-105
                           shadow-md transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed
                           disabled:hover:scale-100"
              >
                {isAnalyzing || isRegenerating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to add messages from parent component
export const useChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => setMessages([]);

  return { messages, addMessage, clearMessages, setMessages };
};
