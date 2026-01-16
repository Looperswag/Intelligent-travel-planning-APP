import React, { useState, useRef, useEffect } from 'react';
import { TripDetails, MediaItem, UploadedFile, SocialLink, AgentStage, SceneType } from '../types';
import { validateTripIntent } from '../services/glmService';
import {
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  ArrowRight,
  MapPin,
  AlertCircle,
  BrainCircuit,
  Heart,
  Users,
  Mountain,
  Briefcase,
  Utensils,
  Landmark,
  Sun,
  User
} from 'lucide-react';

interface InputFormProps {
  onGenerate: (details: TripDetails, media: MediaItem[]) => void;
  isGenerating: boolean;
  agentStage: AgentStage; // Receive stage from parent
}

// File upload constraints
const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB per file
  MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB total
  MAX_COUNT: 10, // Maximum 10 files
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime']
};

export const InputForm: React.FC<InputFormProps> = ({ onGenerate, isGenerating, agentStage: _agentStage }) => {
  const [prompt, setPrompt] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [tempLink, setTempLink] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Scene selection state
  const [selectedScene, setSelectedScene] = useState<SceneType | null>(null);
  const [predictedScene, setPredictedScene] = useState<SceneType | null>(null);
  const [showSceneSelector, _setShowSceneSelector] = useState(false);

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

  // Scene prediction based on user input
  useEffect(() => {
    // DISABLED: Temporarily disable scene prediction to debug white screen issue
    /*
    if (prompt.length > 10) {
      // Quick local prediction - wrapped in try-catch to prevent app crash
      try {
        const intentAgent = createIntentAgent();
        const predicted = intentAgent.quickPredict(prompt);
        setPredictedScene(predicted);
      } catch (error) {
        console.error('Scene prediction failed:', error);
        setPredictedScene(null);
      }
    } else {
      setPredictedScene(null);
    }
    */
    setPredictedScene(null);
  }, [prompt]);

  // Scene configurations
  const sceneConfig = [
    { type: SceneType.ROMANTIC, name: '浪漫', icon: Heart, color: 'rose' },
    { type: SceneType.FAMILY, name: '亲子', icon: Users, color: 'amber' },
    { type: SceneType.ADVENTURE, name: '探险', icon: Mountain, color: 'emerald' },
    { type: SceneType.BUSINESS, name: '商务', icon: Briefcase, color: 'slate' },
    { type: SceneType.FOODIE, name: '美食', icon: Utensils, color: 'orange' },
    { type: SceneType.CULTURE, name: '文化', icon: Landmark, color: 'indigo' },
    { type: SceneType.RELAXATION, name: '度假', icon: Sun, color: 'teal' },
    { type: SceneType.SOLO, name: '独行', icon: User, color: 'blue' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileError(null);
      const files = Array.from(e.target.files);

      // Validation 1: Check file count
      const currentFileCount = mediaItems.filter(item => 'file' in item).length;
      if (currentFileCount + files.length > FILE_CONSTRAINTS.MAX_COUNT) {
        setFileError(`最多只能上传 ${FILE_CONSTRAINTS.MAX_COUNT} 个文件`);
        return;
      }

      // Validation 2: Check individual file sizes
      for (const file of files) {
        if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
          setFileError(`文件 "${file.name}" 太大（最大 ${FILE_CONSTRAINTS.MAX_SIZE / 1024 / 1024}MB）`);
          return;
        }
      }

      // Validation 3: Check total size
      const currentTotalSize = mediaItems
        .filter(item => 'file' in item)
        .reduce((sum, item) => sum + (item as UploadedFile).file.size, 0);
      const newFilesSize = files.reduce((sum, file) => sum + file.size, 0);
      if (currentTotalSize + newFilesSize > FILE_CONSTRAINTS.MAX_TOTAL_SIZE) {
        setFileError(`总文件大小不能超过 ${FILE_CONSTRAINTS.MAX_TOTAL_SIZE / 1024 / 1024}MB`);
        return;
      }

      // Validation 4: Check file types
      const validFiles = files.filter(file => {
        const isImage = FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(file.type);
        const isVideo = FILE_CONSTRAINTS.ALLOWED_VIDEO_TYPES.includes(file.type);
        if (!isImage && !isVideo) {
          console.warn(`Invalid file type: ${file.type}`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        setFileError('请选择有效的图片 (JPG, PNG, GIF, WebP) 或视频 (MP4, WebM, MOV) 文件');
        return;
      }

      if (validFiles.length < files.length) {
        setFileError(`已跳过 ${files.length - validFiles.length} 个不支持的文件`);
      }

      // Process valid files
      const newFiles = validFiles.map(file => {
        return new Promise<UploadedFile>((resolve, reject) => {
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

          reader.onerror = () => {
            reject(new Error(`Failed to read file: ${file.name}`));
          };

          // Read file with size consideration
          if (file.size > 5 * 1024 * 1024) { // 5MB+
            // For large files, still read but could be optimized
            reader.readAsDataURL(file);
          } else {
            reader.readAsDataURL(file);
          }
        });
      });

      Promise.all(newFiles)
        .then(processedFiles => {
          setMediaItems(prev => [...prev, ...processedFiles]);
        })
        .catch(error => {
          console.error('File processing error:', error);
          setFileError('文件处理失败，请重试');
        });
    }

    // Reset input value to allow selecting same file again
    e.target.value = '';
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
    setMediaItems(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      // Clean up object URL to free memory
      if (itemToRemove && 'previewUrl' in itemToRemove) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter(item => item.id !== id);
    });
    if (fileError) setFileError(null);
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

  // Note: When isGenerating is true, the sidebar is hidden via w-0 opacity-0 in App.tsx
  // The full-screen AgentLoadingScreen is displayed instead
  if (isGenerating) {
    return null; // Sidebar is hidden, full-screen loading is shown by AgentLoadingScreen
  }

  // --- Normal Input Form ---
  return (
    <div className="h-full flex flex-col bg-morandi-paper/60 backdrop-blur-xl border-r border-white/50 relative transition-all duration-500 ease-out">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-morandi-sage/5 rounded-full blur-3xl pointer-events-none animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-morandi-accent/5 rounded-full blur-2xl pointer-events-none animate-blob" style={{animationDelay: '3s'}}></div>

      <div className="px-10 pt-12 pb-6 animate-slide-up relative z-10" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-morandi-sage/20 rounded-lg animate-pulse-ring"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-morandi-sage to-morandi-clay rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={18} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-light text-morandi-charcoal tracking-tight">
              Wanderlust
              <span className="ml-2 inline-block w-1.5 h-1.5 bg-morandi-sage rounded-full animate-pulse"></span>
            </h1>
            <p className="text-morandi-slate mt-1 text-xs tracking-wide">
              Generator-Critic 架构旅行规划
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-10 py-4 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative z-10">
        <div
          className={`
            bg-white rounded-[2rem] p-6 shadow-glass border transition-all duration-300 relative group cursor-pointer
            ${isFocused ? 'ring-2 ring-morandi-sage/30 shadow-float shadow-glow transform scale-[1.01]' : 'border-white/60 hover:border-morandi-clay/50 hover:shadow-lg'}
            ${validationError ? 'ring-2 ring-red-200 border-red-200' : ''}
            animate-slide-up overflow-hidden
          `}
          style={{ animationDelay: '0.2s' }}
          onClick={() => {
            const textarea = document.querySelector('textarea');
            if (textarea) textarea.focus();
          }}
        >
          {/* Shimmer Effect on Hover */}
          <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-12deg] group-hover:animate-shimmer pointer-events-none"></div>

          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-morandi-accent/10 rounded-lg group-hover:bg-morandi-accent/20 transition-colors">
                <Sparkles size={14} className="text-morandi-accent" />
              </div>
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
            className="w-full bg-transparent border-0 focus:ring-0 text-morandi-charcoal placeholder-morandi-clay resize-none text-lg leading-relaxed min-h-[180px] selection:bg-morandi-sage/20 relative z-10"
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
                <div key={item.id} className="relative flex-shrink-0 group animate-scale-in cursor-pointer">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-morandi-base/50 shadow-md group-hover:border-morandi-sage/50 group-hover:shadow-lg transition-all duration-300">
                    {'url' in item ? (
                      <div className="w-full h-full bg-morandi-base flex flex-col items-center justify-center p-2 text-center">
                       <LinkIcon size={16} className="text-morandi-slate mb-1" />
                       <span className="text-[8px] text-morandi-slate break-all line-clamp-2 leading-tight">{item.url}</span>
                      </div>
                    ) : item.type === 'video' ? (
                      <video src={item.previewUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <img src={item.previewUrl} alt="upload" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110" />
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-morandi-sage/0 group-hover:ring-morandi-sage/30 transition-all duration-300"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(item.id);
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-white text-morandi-accent rounded-full p-1.5 shadow-lg hover:bg-morandi-accent hover:text-white transition-all duration-200 transform scale-0 group-hover:scale-100 hover:scale-110 cursor-pointer z-20"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {fileError && (
            <div className="flex items-center gap-2 px-3 py-2 mt-2 bg-orange-50 text-orange-600 text-xs rounded-lg animate-fade-in">
              <AlertCircle size={12} />
              <span>{fileError}</span>
              <button onClick={() => setFileError(null)} className="ml-auto">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed border-morandi-base">
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-morandi-base/50 hover:bg-morandi-sage/10 text-morandi-slate text-xs transition-all duration-200 cursor-pointer hover:shadow-md border border-transparent hover:border-morandi-sage/30"
              >
                <div className="p-1 bg-morandi-sage/10 rounded-full group-hover:bg-morandi-sage/20 transition-colors">
                  <ImageIcon size={12} className="group-hover:scale-110 transition-transform" />
                </div>
                <span>添加图片/视频</span>
                {mediaItems.filter(m => 'file' in m).length > 0 && (
                  <span className="bg-morandi-sage/20 text-morandi-sage px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                    {mediaItems.filter(m => 'file' in m).length}/{FILE_CONSTRAINTS.MAX_COUNT}
                  </span>
                )}
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
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-full bg-morandi-base/50 hover:bg-morandi-accent/10 text-morandi-slate text-xs transition-all duration-200 cursor-pointer hover:shadow-md border border-transparent hover:border-morandi-accent/30 ${showLinkInput ? 'ring-2 ring-morandi-sage/30 bg-morandi-sage/10' : ''}`}
                >
                  <div className="p-1 bg-morandi-accent/10 rounded-full group-hover:bg-morandi-accent/20 transition-colors">
                    <LinkIcon size={12} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <span>参考链接</span>
                </button>

                {showLinkInput && (
                  <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-morandi-base p-2 z-20 flex gap-2 animate-slide-up">
                    <input
                      type="text"
                      className="flex-1 text-xs bg-morandi-base/50 rounded-xl px-3 py-2 border-0 focus:ring-2 focus:ring-morandi-sage/50 placeholder-morandi-dust transition-all cursor-text"
                      placeholder="粘贴 URL..."
                      value={tempLink}
                      onChange={(e) => setTempLink(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addLink()}
                      autoFocus
                    />
                    <button onClick={addLink} className="bg-morandi-sage text-white p-2 rounded-xl hover:bg-morandi-charcoal hover:scale-105 active:scale-95 transition-all cursor-pointer">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scene Selector */}
        {(predictedScene || showSceneSelector) && (
          <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <div className="bg-white rounded-[1.5rem] p-5 shadow-glass border border-morandi-base/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-morandi-sage" />
                  <span className="text-xs font-bold text-morandi-dust tracking-widest uppercase">
                    旅行类型
                  </span>
                </div>
                {predictedScene && !selectedScene && (
                  <span className="text-xs text-morandi-sage bg-morandi-sage/10 px-2 py-1 rounded-full">
                    AI 推荐场景
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {sceneConfig.map((scene) => {
                  const Icon = scene.icon;
                  const isSelected = selectedScene === scene.type;
                  const isPredicted = predictedScene === scene.type && !selectedScene;

                  return (
                    <button
                      key={scene.type}
                      onClick={() => {
                        setSelectedScene(scene.type === selectedScene ? null : scene.type);
                      }}
                      className={`
                        flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200
                        ${isSelected
                          ? `bg-${scene.color}-100 ring-2 ring-${scene.color}-400 shadow-md`
                          : isPredicted
                          ? `bg-${scene.color}-50/50 ring-1 ring-${scene.color}-300 ring-opacity-50`
                          : 'bg-morandi-base/30 hover:bg-morandi-base/50'
                        }
                      `}
                    >
                      <Icon
                        size={18}
                        className={isSelected || isPredicted ? `text-${scene.color}-600` : 'text-morandi-slate'}
                      />
                      <span className={`text-xs font-medium ${
                        isSelected || isPredicted ? `text-${scene.color}-900` : 'text-morandi-slate'
                      }`}>
                        {scene.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedScene && (
                <div className="mt-3 flex items-center justify-between text-xs text-morandi-slate">
                  <span>已选择：{sceneConfig.find(s => s.type === selectedScene)?.name}风格</span>
                  <button
                    onClick={() => setSelectedScene(null)}
                    className="text-morandi-accent hover:text-morandi-charcoal"
                  >
                    清除选择
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
           <p className="text-xs text-morandi-dust leading-relaxed flex items-start gap-2">
             <MapPin size={12} className="mt-0.5 shrink-0" />
             AI 将启动 Generator-Critic 双重验证模式，分别进行事实搜索、路线计算与可行性评估。
           </p>
        </div>

      </div>

      <div className="p-10 animate-slide-up relative z-10" style={{ animationDelay: '0.4s' }}>
        <button
          onClick={handleSubmit}
          disabled={(!prompt && mediaItems.length === 0) || isValidating}
          className={`
            w-full py-5 rounded-[1.5rem] font-medium text-white shadow-float
            flex items-center justify-center gap-3 text-lg tracking-wide
            transition-all duration-300 ease-out transform
            relative overflow-hidden group
            ${(!prompt && mediaItems.length === 0) || isValidating
              ? 'bg-morandi-clay cursor-not-allowed opacity-70'
              : 'bg-gradient-to-r from-morandi-charcoal to-morandi-slate hover:scale-[1.02] hover:shadow-2xl hover:shadow-glow cursor-pointer'}
          `}
        >
          {/* Shimmer Effect */}
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-shimmer pointer-events-none"></div>

          {/* Gradient Border Glow Effect on Hover */}
          <div className="absolute inset-0 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-morandi-sage/20 via-morandi-accent/20 to-morandi-sage/20 animate-gradient-x"></div>

          {/* Content */}
          <span className="relative z-10 flex items-center gap-3">
            {isValidating ? (
              <>
                <BrainCircuit size={20} className="animate-spin" />
                <span>意图解析中...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} className={(!prompt && mediaItems.length === 0) ? '' : 'text-morandi-sage animate-bounce-soft'} />
                <span>启动规划 Agent</span>
              </>
            )}
          </span>

          {/* Corner Accents */}
          <svg className="absolute top-0 left-0 w-16 h-16 -mt-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" viewBox="0 0 64 64">
            <path d="M0 0 L24 0 L0 24 Z" fill="url(#corner-gradient)" />
            <defs>
              <linearGradient id="corner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(156, 168, 152, 0.4)" />
                <stop offset="100%" stopColor="rgba(156, 168, 152, 0)" />
              </linearGradient>
            </defs>
          </svg>
          <svg className="absolute bottom-0 right-0 w-16 h-16 -mb-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" viewBox="0 0 64 64">
            <path d="M64 64 L40 64 L64 40 Z" fill="url(#corner-gradient-2)" />
            <defs>
              <linearGradient id="corner-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(156, 168, 152, 0)" />
                <stop offset="100%" stopColor="rgba(156, 168, 152, 0.4)" />
              </linearGradient>
            </defs>
          </svg>
        </button>

        {/* Helper Text */}
        <p className="text-center text-xs text-morandi-dust mt-4 animate-fade-in">
          按 Enter 键快速开始 · AI 将自动规划您的完美旅程
        </p>
      </div>
    </div>
  );
}