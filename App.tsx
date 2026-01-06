import React, { useState, useEffect, useRef } from 'react';
import { InputForm } from './components/InputForm';
import { PlanPreview, PlanPreviewHandle } from './components/PlanPreview';
import { TripDetails, MediaItem, LoadingState, AgentStage } from './types';
import { generateTravelPlanStream } from './services/geminiService';
import { 
  Download, 
  Terminal, 
  ChevronDown, 
  FileCode, 
  Printer, 
  Share2, 
  Twitter, 
  Copy, 
  Smartphone,
  Check,
  MessageSquare,
  Star,
  Send,
  X,
  Linkedin,
  Instagram,
  Link as LinkIcon
} from 'lucide-react';

// --- Thinking Console Component (Inline for simplicity) ---
const ThinkingConsole = ({ logs }: { logs: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full bg-[#1e1e1e] p-8 overflow-hidden flex flex-col font-mono relative">
       <div className="flex items-center gap-2 mb-4 text-gray-500 border-b border-gray-800 pb-3">
         <Terminal size={14} />
         <span className="text-xs uppercase tracking-widest font-bold">Gemini Inference Stream</span>
       </div>
       
       <div 
         ref={scrollRef}
         className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pb-20"
       >
         <pre className="text-sm leading-7 whitespace-pre-wrap text-gray-400 font-mono font-light opacity-90">
           {logs}
           <span className="inline-block w-2 h-4 bg-morandi-sage ml-1 animate-pulse"/>
         </pre>
       </div>

       {/* Fade overlay at bottom */}
       <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1e1e1e] to-transparent pointer-events-none"></div>
    </div>
  );
};

export default function App() {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [agentStage, setAgentStage] = useState<AgentStage>(AgentStage.IDLE);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [streamLog, setStreamLog] = useState<string>(""); // Raw stream content
  const [parsedLog, setParsedLog] = useState<string>(""); // Just the reasoning part
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTrip, setCurrentTrip] = useState<TripDetails | null>(null);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Feedback State
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  
  const planPreviewRef = useRef<PlanPreviewHandle>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
      // Note: We don't close feedback modal on outside click to prevent accidental data loss
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 模拟侧边栏 Agent 阶段的视觉流转，配合真实的流式输出
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadingState === LoadingState.GENERATING) {
      setAgentStage(AgentStage.INGESTING);
      
      const timings = [
        { stage: AgentStage.RESEARCHING, delay: 3000 },
        { stage: AgentStage.PLANNING, delay: 10000 }, 
        { stage: AgentStage.FINALIZING, delay: 20000 }
      ];

      let currentStep = 0;
      interval = setInterval(() => {
        if (currentStep < timings.length) {
           setAgentStage(timings[currentStep].stage);
           currentStep++;
        }
      }, 5000); 
    }
    return () => clearInterval(interval);
  }, [loadingState]);

  const handleGenerate = async (details: TripDetails, mediaItems: MediaItem[]) => {
    setLoadingState(LoadingState.GENERATING);
    setStreamLog("");
    setParsedLog("");
    setGeneratedHtml(null);
    setErrorMsg(null);
    setAgentStage(AgentStage.INGESTING);
    setCurrentTrip(details); // Save trip details for sharing context
    setShowExportMenu(false);
    setShowShareMenu(false);
    
    // Reset Feedback State
    setRating(0);
    setComment("");
    setIsFeedbackSubmitted(false);
    setShowFeedback(false);

    try {
      let fullContent = "";
      const stream = generateTravelPlanStream(details, mediaItems);
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setStreamLog(fullContent);

        // Simple parsing to separate Log from HTML
        const parts = fullContent.split("<<<HTML_START>>>");
        setParsedLog(parts[0]); // Always update the log part
        
        // If we have the HTML part, we could theoretically preview it incrementally, 
        // but browsers don't handle partial HTML well. We wait for stream end usually,
        // or just let the log run until finish.
      }

      const finalParts = fullContent.split("<<<HTML_START>>>");
      if (finalParts.length > 1) {
        let html = finalParts[1];
        html = html.replace(/^```html/, '').replace(/```$/, '');
        setGeneratedHtml(html);
        setLoadingState(LoadingState.SUCCESS);
      } else {
        // Fallback if separator missing (sometimes model forgets separator)
        // Check for doctype or html tag
        if (fullContent.includes("<!DOCTYPE html>")) {
           const parts = fullContent.split("<!DOCTYPE html>");
           setGeneratedHtml("<!DOCTYPE html>" + parts[1].replace(/```$/, ''));
           setLoadingState(LoadingState.SUCCESS);
        } else {
           setGeneratedHtml(fullContent.replace(/^```html/, '').replace(/```$/, ''));
           setLoadingState(LoadingState.SUCCESS);
        }
      }
      
      setAgentStage(AgentStage.IDLE);

    } catch (err: any) {
      console.error(err);
      
      // Better Error Handling for Quotas
      let errorMessage = err.message || "Agent connection lost. Please try again.";
      
      // Attempt to extract cleaner message if it's a JSON dump from Google
      try {
        // Often the error message is a JSON string like '{"error": ...}'
        if (errorMessage.includes('{')) {
          const start = errorMessage.indexOf('{');
          const jsonPart = errorMessage.substring(start);
          const parsed = JSON.parse(jsonPart);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          }
        }
      } catch (e) {
        // Failed to parse, use original
      }

      // Check for common rate limit codes
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "API 调用过于频繁或配额耗尽 (429)。请稍后重试。";
      }

      setErrorMsg(errorMessage);
      setLoadingState(LoadingState.ERROR);
      setAgentStage(AgentStage.IDLE);
    }
  };

  const handleDownloadHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Wanderlust_Trip_Plan.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrintPdf = () => {
    if (planPreviewRef.current) {
      planPreviewRef.current.print();
    }
    setShowExportMenu(false);
  };

  // --- Sharing Logic ---
  const getShareContext = () => {
    const prompt = currentTrip?.prompt || "";
    // Truncate to reasonable length for social posts
    const shortPrompt = prompt.length > 60 ? prompt.substring(0, 60) + "..." : prompt;
    return shortPrompt ? `Planning my trip: "${shortPrompt}"` : "My amazing travel itinerary";
  };

  const getSimulatedLink = () => {
    // In a real app, this would be a permalink. Here we simulate it.
    return `https://wanderlust.ai/plan/${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${getShareContext()} - Generated by Wanderlust AI! 🌍✈️ #Travel #AI #Wanderlust`);
    const url = encodeURIComponent(getSimulatedLink());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareLinkedin = () => {
    const summary = `${getShareContext()}. I just generated this detailed itinerary using Wanderlust AI. The evidential reasoning and planning capabilities are impressive!`;
    const url = getSimulatedLink();
    // LinkedIn share URL format
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(summary + " " + url)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareInstagram = () => {
    // Instagram works best with images, but for web flow, we copy a caption and open IG.
    const caption = `${getShareContext()} 🌍✈️\n\nGenerated with Wanderlust AI.\n\n#Travel #Itinerary #Wanderlust #AIPlanning #TravelGram`;
    navigator.clipboard.writeText(caption).then(() => {
        // Optional: Notify user caption is copied? We'll rely on the button text change or standard behavior.
        window.open('https://www.instagram.com/', '_blank');
    });
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    const link = getSimulatedLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleCopyText = () => {
    const text = `${getShareContext()} - Check out Wanderlust AI! 🌍✈️`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wanderlust AI Planner',
          text: `${getShareContext()} 🌍✈️`,
          url: getSimulatedLink()
        });
        setShowShareMenu(false);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  const submitFeedback = () => {
    console.log("📝 Feedback Log:", {
        rating,
        comment,
        timestamp: new Date().toISOString()
    });
    setIsFeedbackSubmitted(true);
    setTimeout(() => {
        setShowFeedback(false);
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-morandi-base overflow-hidden font-sans text-morandi-charcoal">
      
      {/* Sidebar Area */}
      <div className={`
        flex-shrink-0 h-full z-20 relative bg-morandi-base transition-all duration-700 ease-in-out
        ${loadingState === LoadingState.SUCCESS ? 'w-full md:w-[400px]' : 'w-full md:w-[500px] lg:w-[600px]'}
      `}>
        <InputForm 
          onGenerate={handleGenerate} 
          isGenerating={loadingState === LoadingState.GENERATING}
          agentStage={agentStage}
        />
      </div>

      {/* Preview / Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] transition-all duration-700">
        
        {/* Floating Toolbar */}
        {loadingState === LoadingState.SUCCESS && (
          <div className="absolute top-6 right-8 z-30 flex gap-3">
             
             {/* Feedback Button */}
             <button 
                onClick={() => setShowFeedback(true)}
                className="group flex items-center justify-center w-12 h-12 bg-white text-morandi-charcoal rounded-full shadow-float hover:shadow-xl hover:scale-105 transition-all border border-morandi-base"
                title="反馈评价"
             >
                <MessageSquare size={18} className="text-morandi-slate group-hover:text-morandi-charcoal transition-colors" />
             </button>

             {/* Share Button */}
             <div className="relative" ref={shareMenuRef}>
               <button
                 onClick={() => setShowShareMenu(!showShareMenu)}
                 className="group flex items-center justify-center w-12 h-12 bg-white text-morandi-charcoal rounded-full shadow-float hover:shadow-xl hover:scale-105 transition-all border border-morandi-base"
                 title="分享行程"
               >
                 <Share2 size={18} className="text-morandi-slate group-hover:text-morandi-charcoal transition-colors" />
               </button>

               {showShareMenu && (
                 <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-morandi-base overflow-hidden animate-scale-in origin-top-right z-40">
                    <div className="p-1">
                      {/* Copy Link */}
                      <button 
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-morandi-charcoal hover:bg-morandi-base rounded-lg transition-colors text-left"
                      >
                        <div className="p-2 bg-morandi-base rounded-lg text-morandi-slate">
                          {copiedLink ? <Check size={16} className="text-green-600" /> : <LinkIcon size={16} />}
                        </div>
                        <div className="flex flex-col">
                           <span className="font-medium">{copiedLink ? "已复制链接" : "复制行程链接"}</span>
                           <span className="text-[10px] text-morandi-dust">wanderlust.ai/plan/...</span>
                        </div>
                      </button>

                      <div className="h-px bg-morandi-base mx-2 my-1"></div>

                      {/* Twitter */}
                      <button 
                        onClick={handleShareTwitter}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-morandi-charcoal hover:bg-morandi-base rounded-lg transition-colors text-left"
                      >
                        <div className="p-1.5 bg-sky-50 rounded-lg text-sky-500">
                          <Twitter size={16} />
                        </div>
                        <span className="font-medium">Twitter (X)</span>
                      </button>
                      
                      {/* LinkedIn */}
                      <button 
                        onClick={handleShareLinkedin}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-morandi-charcoal hover:bg-morandi-base rounded-lg transition-colors text-left"
                      >
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-700">
                          <Linkedin size={16} />
                        </div>
                        <span className="font-medium">LinkedIn</span>
                      </button>

                      {/* Instagram */}
                      <button 
                        onClick={handleShareInstagram}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-morandi-charcoal hover:bg-morandi-base rounded-lg transition-colors text-left"
                      >
                        <div className="p-1.5 bg-pink-50 rounded-lg text-pink-500">
                          <Instagram size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">Instagram</span>
                            <span className="text-[10px] text-morandi-dust">复制文案并打开</span>
                        </div>
                      </button>

                      {/* Copy Text Summary */}
                      <button 
                        onClick={handleCopyText}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-morandi-charcoal hover:bg-morandi-base rounded-lg transition-colors text-left"
                      >
                        <div className="p-1.5 bg-morandi-base rounded-lg text-morandi-slate">
                          {copiedText ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </div>
                        <span className="font-medium">{copiedText ? "已复制摘要" : "复制文本摘要"}</span>
                      </button>

                      {navigator.share && (
                        <button 
                          onClick={handleNativeShare}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-morandi-charcoal hover:bg-morandi-base rounded-lg transition-colors text-left"
                        >
                          <div className="p-1.5 bg-morandi-base rounded-lg text-morandi-slate">
                            <Smartphone size={16} />
                          </div>
                          <span className="font-medium">更多选项...</span>
                        </button>
                      )}
                    </div>
                 </div>
               )}
             </div>

             {/* Export Button */}
             <div className="relative" ref={exportMenuRef}>
               <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="group flex items-center gap-2 bg-morandi-charcoal text-white px-6 py-3 rounded-full text-sm font-medium shadow-float hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                >
                  <Download size={16} />
                  <span>导出行程</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-morandi-base overflow-hidden animate-scale-in origin-top-right z-40">
                    <div className="p-1">
                      <button 
                        onClick={handleDownloadHtml}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-morandi-charcoal hover:bg-morandi-base rounded-lg transition-colors text-left"
                      >
                        <div className="p-2 bg-morandi-base rounded-lg text-morandi-slate">
                          <FileCode size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">网页源码</span>
                          <span className="text-[10px] text-morandi-dust">.html 文件</span>
                        </div>
                      </button>

                      <button 
                        onClick={handlePrintPdf}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-morandi-charcoal hover:bg-morandi-base rounded-lg transition-colors text-left"
                      >
                        <div className="p-2 bg-morandi-base rounded-lg text-morandi-slate">
                          <Printer size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">另存为 PDF</span>
                          <span className="text-[10px] text-morandi-dust">推荐打印模式</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Feedback Modal Overlay */}
        {showFeedback && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
                <div 
                    ref={feedbackRef}
                    className="bg-white rounded-2xl p-6 shadow-2xl w-80 md:w-96 transform transition-all animate-scale-in relative border border-morandi-base"
                >
                    <button 
                        onClick={() => setShowFeedback(false)}
                        className="absolute top-4 right-4 text-morandi-dust hover:text-morandi-charcoal transition-colors"
                    >
                        <X size={18} />
                    </button>
                    
                    {!isFeedbackSubmitted ? (
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-bold text-morandi-charcoal mb-1">评价生成的行程</h3>
                            <p className="text-xs text-morandi-slate mb-6">您的反馈将帮助 AI 进化</p>
                            
                            <div className="flex gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star 
                                            size={28} 
                                            className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-morandi-base fill-morandi-base'}`} 
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                className="w-full bg-morandi-base/30 rounded-xl p-3 text-sm text-morandi-charcoal placeholder-morandi-dust focus:ring-1 focus:ring-morandi-sage focus:outline-none resize-none mb-4"
                                rows={3}
                                placeholder="有什么需要改进的吗？..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />

                            <button
                                onClick={submitFeedback}
                                disabled={rating === 0}
                                className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2
                                    ${rating > 0 ? 'bg-morandi-charcoal text-white hover:bg-black shadow-lg' : 'bg-morandi-base text-morandi-dust cursor-not-allowed'}
                                `}
                            >
                                <span>提交反馈</span>
                                <Send size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8 animate-fade-in">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                                <Check size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-morandi-charcoal">感谢您的反馈</h3>
                            <p className="text-xs text-morandi-slate">我们会做得更好</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Content Container */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          
          {loadingState === LoadingState.IDLE && (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 bg-morandi-base/30 relative">
               <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-5 pointer-events-none select-none">
                 <span className="text-[20vw] font-serif italic text-morandi-clay">Plan</span>
               </div>

               <div className="relative z-10 max-w-lg text-center space-y-8 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4 opacity-80">
                    <div className="aspect-[3/4] rounded-2xl bg-[url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center translate-y-8 shadow-lg"></div>
                    <div className="aspect-[3/4] rounded-2xl bg-[url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center shadow-lg"></div>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-serif italic text-morandi-charcoal mb-2">Evidence-Based Planning</h2>
                    <p className="text-morandi-slate font-light">
                      AI Agent 将基于全网事实数据<br/>为您构建可落地的完美行程。
                    </p>
                  </div>
               </div>
            </div>
          )}

          {loadingState === LoadingState.GENERATING && (
            <ThinkingConsole logs={parsedLog} />
          )}

          {loadingState === LoadingState.ERROR && (
            <div className="h-full flex flex-col items-center justify-center bg-white">
              <div className="p-8 rounded-3xl bg-red-50 text-red-800 flex flex-col items-center gap-4 max-w-md text-center animate-slide-up">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                   ⚠️
                </div>
                <h3 className="text-lg font-bold">生成中断</h3>
                <p className="text-sm opacity-80 break-words">{errorMsg}</p>
                <button 
                  onClick={() => setLoadingState(LoadingState.IDLE)}
                  className="px-6 py-2 bg-white border border-red-200 rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {loadingState === LoadingState.SUCCESS && generatedHtml && (
             <div className="w-full h-full bg-white animate-fade-in origin-bottom">
                <PlanPreview 
                  ref={planPreviewRef}
                  htmlContent={generatedHtml} 
                />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}