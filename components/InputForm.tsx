import React, { useState, useRef, useEffect } from 'react';
import { TripDetails, MediaItem, UploadedFile, SocialLink, AgentStage } from '../types';
import { validateTripIntent } from '../services/geminiService';
import { 
  Sparkles, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  X, 
  ArrowRight,
  MapPin,
  AlertCircle,
  BrainCircuit,
  Search,
  Map as MapIcon,
  FileCode,
  CheckCircle2
} from 'lucide-react';

interface InputFormProps {
  onGenerate: (details: TripDetails, media: MediaItem[]) => void;
  isGenerating: boolean;
  agentStage: AgentStage; // Receive stage from parent
}

export const InputForm: React.FC<InputFormProps> = ({ onGenerate, isGenerating, agentStage }) => {
  const [prompt, setPrompt] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [tempLink, setTempLink] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const placeholders = [
    "比如：我想去京都看红叶，大概5天，预算2万，喜欢小众咖啡馆...",
    "比如：带父母去三亚，需要住海景房，行程要轻松，不要太累...",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = (Array.from(e.target.files) as File[]).map(file => {
        return new Promise<UploadedFile>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              id: Date.now().toString() + Math.random().toString(),
              file,
              previewUrl: URL.createObjectURL(file),
              base64: reader.result as string,
              mimeType: file.type,
              type: file.type.startsWith('video/') ? 'video' : 'image'
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newFiles).then(processedFiles => {
        setMediaItems(prev => [...prev, ...processedFiles]);
      });
    }
  };

  const addLink = () => {
    if (tempLink.trim()) {
      const newLink: SocialLink = {
        id: Date.now().toString(),
        url: tempLink,
        type: 'link'
      };
      setMediaItems(prev => [...prev, newLink]);
      setTempLink('');
      setShowLinkInput(false);
    }
  };

  const removeMedia = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (!prompt.trim() && mediaItems.length === 0) return;
    
    setValidationError(null);
    setIsValidating(true);

    try {
      const validation = await validateTripIntent(prompt);
      if (!validation.isValid) {
        setValidationError(validation.message || "请补充旅行目的地等关键信息");
        setIsValidating(false);
        return;
      }
      onGenerate({ prompt }, mediaItems);
    } catch (error: any) {
      console.error(error);
      setValidationError(error.message || "校验失败，请重试");
    } finally {
      setIsValidating(false);
    }
  };

  // --- Visualization of the Agent Workflow (Based on PDF) ---
  if (isGenerating) {
    const steps = [
      { id: AgentStage.INGESTING, label: "Ingestor Agent", desc: "解析需求 & 提取灵感", icon: BrainCircuit },
      { id: AgentStage.RESEARCHING, label: "Researcher Agent", desc: "全网核验事实 (Evidence)", icon: Search },
      { id: AgentStage.PLANNING, label: "Planner Agent", desc: "路线规划 & 可行性计算", icon: MapIcon },
      { id: AgentStage.FINALIZING, label: "Finalizer Agent", desc: "生成 HTML 交互界面", icon: FileCode },
    ];

    // Find current active step index for styling
    const stagesOrder = [AgentStage.INGESTING, AgentStage.RESEARCHING, AgentStage.PLANNING, AgentStage.FINALIZING];
    const currentIndex = stagesOrder.indexOf(agentStage);

    return (
      <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-morandi-base/50 p-8">
        <div className="max-w-md w-full">
          <h3 className="text-2xl font-light text-morandi-charcoal mb-8 text-center tracking-wide">
            Agent Orchestrator Running...
          </h3>

          <div className="relative space-y-6">
            {/* Connection Line */}
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-morandi-clay/30 -z-10" />

            {steps.map((step, idx) => {
              const isActive = idx === currentIndex;
              const isCompleted = idx < currentIndex;
              const isPending = idx > currentIndex;

              return (
                <div key={step.id} className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'scale-105' : 'opacity-60'}`}>
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 bg-white
                    ${isActive ? 'border-morandi-sage text-morandi-sage shadow-lg animate-pulse' : ''}
                    ${isCompleted ? 'border-morandi-sage bg-morandi-sage text-white' : ''}
                    ${isPending ? 'border-morandi-dust text-morandi-dust' : ''}
                  `}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
                  </div>
                  
                  <div className="flex-1 p-4 bg-white/60 backdrop-blur rounded-xl border border-white shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-bold text-sm ${isActive ? 'text-morandi-charcoal' : 'text-morandi-slate'}`}>
                        {step.label}
                      </span>
                      {isActive && <span className="text-[10px] uppercase bg-morandi-sage/10 text-morandi-sage px-2 py-0.5 rounded-full animate-pulse">Processing</span>}
                    </div>
                    <p className="text-xs text-morandi-slate">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Normal Input Form ---
  return (
    <div className="h-full flex flex-col bg-morandi-paper/60 backdrop-blur-xl border-r border-white/50 relative transition-all duration-500 ease-out">
      
      <div className="px-10 pt-12 pb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-4xl font-light text-morandi-charcoal tracking-tighter flex items-center gap-3">
          Wanderlust
          <span className="w-2 h-2 bg-morandi-sage rounded-full animate-pulse"></span>
        </h1>
        <p className="text-morandi-slate mt-2 text-sm tracking-wide pl-1 opacity-80">
          Generator-Critic 架构旅行规划
        </p>
      </div>

      <div className="flex-1 px-10 py-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        <div 
          className={`
            bg-white rounded-[2rem] p-6 shadow-glass border transition-all duration-300 relative
            ${isFocused ? 'ring-2 ring-morandi-sage/30 shadow-float transform scale-[1.01]' : 'border-white/60 hover:border-morandi-clay/50'}
            ${validationError ? 'ring-2 ring-red-200 border-red-200' : ''}
            animate-slide-up
          `}
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="text-morandi-accent mt-1" />
              <label className="text-xs font-bold text-morandi-dust tracking-widest uppercase">您的愿望清单</label>
            </div>
            {validationError && (
              <div className="flex items-center gap-1 text-red-500 text-xs font-medium animate-pulse">
                <AlertCircle size={12} />
                {validationError}
              </div>
            )}
          </div>

          <textarea
            className="w-full bg-transparent border-0 focus:ring-0 text-morandi-charcoal placeholder-morandi-clay resize-none text-lg leading-relaxed min-h-[180px] selection:bg-morandi-sage/20"
            placeholder={placeholders[placeholderIndex]}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (validationError) setValidationError(null);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          {mediaItems.length > 0 && (
            <div className="flex gap-3 overflow-x-auto py-4 mt-2 custom-scrollbar pb-2">
              {mediaItems.map((item) => (
                <div key={item.id} className="relative flex-shrink-0 group animate-scale-in">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-morandi-base shadow-sm">
                    {'url' in item ? (
                      <div className="w-full h-full bg-morandi-base flex flex-col items-center justify-center p-2 text-center">
                         <LinkIcon size={16} className="text-morandi-slate mb-1" />
                         <span className="text-[8px] text-morandi-slate break-all line-clamp-2 leading-tight">{item.url}</span>
                      </div>
                    ) : item.type === 'video' ? (
                      <video src={item.previewUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <img src={item.previewUrl} alt="upload" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    )}
                  </div>
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="absolute -top-1 -right-1 bg-white text-morandi-accent rounded-full p-1 shadow-md hover:bg-morandi-accent hover:text-white transition-colors transform scale-0 group-hover:scale-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed border-morandi-base">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-morandi-base/50 hover:bg-morandi-base text-morandi-slate text-xs transition-all"
              >
                <ImageIcon size={14} className="group-hover:scale-110 transition-transform" />
                <span>添加图片/视频</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="relative">
                <button 
                  onClick={() => setShowLinkInput(!showLinkInput)}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-full bg-morandi-base/50 hover:bg-morandi-base text-morandi-slate text-xs transition-all ${showLinkInput ? 'ring-1 ring-morandi-sage' : ''}`}
                >
                  <LinkIcon size={14} className="group-hover:scale-110 transition-transform" />
                  <span>参考链接</span>
                </button>
                
                {showLinkInput && (
                  <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-morandi-base p-2 z-20 flex gap-2 animate-slide-up">
                    <input 
                      type="text" 
                      className="flex-1 text-xs bg-morandi-base/50 rounded-xl px-3 py-2 border-0 focus:ring-1 focus:ring-morandi-sage placeholder-morandi-dust"
                      placeholder="粘贴 URL..."
                      value={tempLink}
                      onChange={(e) => setTempLink(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addLink()}
                      autoFocus
                    />
                    <button onClick={addLink} className="bg-morandi-sage text-white p-2 rounded-xl hover:bg-morandi-charcoal transition-colors">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
           <p className="text-xs text-morandi-dust leading-relaxed flex items-start gap-2">
             <MapPin size={12} className="mt-0.5 shrink-0" />
             AI 将启动 Generator-Critic 双重验证模式，分别进行事实搜索、路线计算与可行性评估。
           </p>
        </div>

      </div>

      <div className="p-10 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <button
          onClick={handleSubmit}
          disabled={(!prompt && mediaItems.length === 0) || isValidating}
          className={`
            w-full py-5 rounded-[1.5rem] font-medium text-white shadow-float
            flex items-center justify-center gap-3 text-lg tracking-wide
            transition-all duration-500 ease-out transform
            relative overflow-hidden group
            ${(!prompt && mediaItems.length === 0) || isValidating
              ? 'bg-morandi-clay cursor-not-allowed opacity-80' 
              : 'bg-morandi-charcoal hover:scale-[1.02] hover:shadow-2xl'}
          `}
        >
          <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] group-hover:animate-[shimmer_1.5s_infinite]" />
          
          {isValidating ? (
            <>
              <BrainCircuit size={20} className="animate-spin" />
              <span>意图解析中...</span>
            </>
          ) : (
            <>
               <Sparkles size={20} className={(!prompt && mediaItems.length === 0) ? '' : 'text-morandi-sage'} />
               <span>启动规划 Agent</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}