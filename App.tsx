
import { useState, useEffect, useRef } from 'react';
import { InputForm } from './components/InputForm';
import { PlanPreview, PlanPreviewHandle } from './components/PlanPreview';
import { ReportChatPanel } from './components/ReportChatPanel';
import { DaySelector, DayConfirmation } from './components/DaySelector';
import { AgentLoadingScreen } from './components/AgentLoadingScreen';
import { FeedbackCollector } from './components/FeedbackCollector';
import { VersionDiffViewer } from './components/VersionDiffViewer';
import { TripDetails, MediaItem, LoadingState, AgentStage, TripSkeleton, FollowUpIntent, EnhancedFollowUpAnalysis, ChatMessage as ChatMessageType, RenderPhase, SkeletonData, VersionHistory, UserFeedback } from './types';
import { generateTravelPlanStream, regenerateDayPlan, generateQAReply, analyzeEnhancedIntent } from './services/glmService';
import { AmapService } from './services/amapService';
import { createFeedbackAgent } from './services/agent/feedbackAgent';
import {
  Download,
  ChevronDown,
  FileCode,
  Printer,
  Share2,
  Twitter,
  Check,
  Loader2,
  Edit3,
  MessageSquare,
  Star,
  Send,
  X,
  Link as LinkIcon,
  Sparkles,
  RotateCcw,
  History,
  GitCompare
} from 'lucide-react';

export default function App() {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [agentStage, setAgentStage] = useState<AgentStage>(AgentStage.IDLE);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trip State for Modification
  const [tripSkeleton, setTripSkeleton] = useState<TripSkeleton | null>(null);
  const [modifyingDay, setModifyingDay] = useState<number | null>(null);
  const [modifyInput, setModifyInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Report Chat State
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [showDayConfirmation, setShowDayConfirmation] = useState(false);
  const [suggestedDayForConfirmation, setSuggestedDayForConfirmation] = useState<number | null>(null);
  const [isAnalyzingIntent, setIsAnalyzingIntent] = useState(false);

  // Loading State
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Progressive Rendering State
  const [skeletonData, setSkeletonData] = useState<SkeletonData | null>(null);
  const [currentPhase, setCurrentPhase] = useState<RenderPhase>(RenderPhase.SKELETON);
  const [renderProgress, setRenderProgress] = useState<number>(0);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Feedback State
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);

  // Version Management State
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showFeedbackCollector, setShowFeedbackCollector] = useState(false);
  const [feedbackTargetDay, setFeedbackTargetDay] = useState<number | undefined>();
  
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Listen for Modify Messages from Iframe ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Verify message comes from same origin
      if (event.origin !== window.location.origin) {
        console.warn('postMessage: Received message from untrusted origin:', event.origin);
        return;
      }

      // Security: Validate message structure
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      // Security: Only accept known message types
      if (event.data.type === 'MODIFY_DAY') {
        // Validate data structure
        if (typeof event.data.day === 'number' && event.data.day > 0) {
          setModifyingDay(event.data.day);
          setModifyInput(""); // Reset input
        } else {
          console.warn('postMessage: Invalid day value:', event.data.day);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGenerate = async (details: TripDetails, mediaItems: MediaItem[]) => {
    setLoadingState(LoadingState.GENERATING);
    setConsoleLogs("");
    setGeneratedHtml(null);
    setErrorMsg(null);
    setAgentStage(AgentStage.INGESTING);
    setTripSkeleton(null);
    setShowExportMenu(false);
    setShowShareMenu(false);
    setInitialPrompt(details.prompt); // Save initial prompt for chat context
    setChatMessages([]); // Reset chat messages
    setGenerationStartTime(Date.now()); // Record start time for remaining time calculation

    // Reset Progressive Rendering State
    setSkeletonData(null);
    setCurrentPhase(RenderPhase.SKELETON);
    setRenderProgress(0);

    // Reset Feedback
    setRating(0);
    setIsFeedbackSubmitted(false);
    setShowFeedback(false);

    try {
      let fullContent = "";
      let logsAccumulator = "";

      const stream = generateTravelPlanStream(details, mediaItems);

      for await (const chunk of stream) {
        if (typeof chunk !== 'string') continue;

        if (chunk.startsWith("<<<HTML_START>>>")) {
          const htmlPart = chunk.replace("<<<HTML_START>>>", "");
          fullContent = htmlPart;
          setAgentStage(AgentStage.PLANNING);
        } else if (chunk.startsWith("<<<SKELETON>>>")) {
          // Parse and store the skeleton for future modification
          const jsonStr = chunk.replace("<<<SKELETON>>>", "");
          try {
            const skeleton = JSON.parse(jsonStr);
            setTripSkeleton(skeleton);

            // Generate skeleton data for SkeletonLoader
            const skelData: SkeletonData = {
              destination: skeleton.destination,
              duration: skeleton.duration,
              sceneType: skeleton.sceneType || 'relaxation',
              estimatedTime: Math.floor(skeleton.duration * 4), // Estimate
              vibe: skeleton.vibe
            };
            setSkeletonData(skelData);
          } catch (e) {
            console.error("Failed to parse skeleton", e);
          }
        } else if (chunk.startsWith(">>>")) {
          // Check if it's a progress update (new protocol)
          const progressMatch = chunk.match(/^>>>\s*({.*})\s*$/);
          if (progressMatch) {
            try {
              const progressData = JSON.parse(progressMatch[1]);
              if (progressData.phase) {
                setCurrentPhase(progressData.phase);
              }
              if (progressData.progress !== undefined) {
                setRenderProgress(progressData.progress);
              }
            } catch (e) {
              // Not a JSON progress update, treat as regular log
              logsAccumulator += chunk;
              setConsoleLogs(logsAccumulator);
            }
          } else {
            logsAccumulator += chunk;
            setConsoleLogs(logsAccumulator);
          }
        } else {
           if (fullContent === "") {
             if (chunk.trim().startsWith(">>>")) {
                logsAccumulator += chunk;
                setConsoleLogs(logsAccumulator);
             } else {
                fullContent += chunk;
             }
           } else {
             fullContent += chunk;
           }
        }
      }

      setGeneratedHtml(fullContent);
      setLoadingState(LoadingState.SUCCESS);
      setAgentStage(AgentStage.FINALIZING);
      setCurrentPhase(RenderPhase.COMPLETE);
      setRenderProgress(100);

      // 保存初始版本到版本历史
      if (tripSkeleton) {
        const feedbackAgent = createFeedbackAgent();
        const initialVersion = feedbackAgent.createVersionHistory(
          tripSkeleton,
          [{
            type: 'global',
            description: '初始生成行程',
            timestamp: Date.now()
          }],
          'AI Planner'
        );
        setVersionHistory([initialVersion]);
      }

      setTimeout(() => setAgentStage(AgentStage.IDLE), 1000);

    } catch (err: unknown) {
      console.error(err);
      let errorMessage = err instanceof Error ? err.message : "Agent 连接中断，请重试。";
      if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        errorMessage = "API 配额已耗尽 (429)，请稍后再试。";
      }
      setErrorMsg(errorMessage);
      setLoadingState(LoadingState.ERROR);
      setAgentStage(AgentStage.IDLE);
      setCurrentPhase(RenderPhase.SKELETON);
      setRenderProgress(0);
    }
  };

  const submitModification = async () => {
    if (!tripSkeleton || modifyingDay === null || !modifyInput.trim() || !generatedHtml) return;

    setIsRegenerating(true);
    
    try {
      // Call service to regenerate JUST that day's HTML
      // Fixed: Removed the 4th argument (userFiles) which was causing type error
      const newDayHtml = await regenerateDayPlan(
        tripSkeleton,
        modifyingDay,
        modifyInput
      );

      // Regex replace the old section with the new section
      // Matches <section id="day-X" ... > ... </section>
      // We use a non-greedy match for content
      const regex = new RegExp(`<section id="day-${modifyingDay}"[\\s\\S]*?<\\/section>`, 'i');
      
      if (regex.test(generatedHtml)) {
        const updatedHtml = generatedHtml.replace(regex, newDayHtml);
        setGeneratedHtml(updatedHtml);
        setModifyingDay(null); // Close modal
      } else {
        alert("无法定位原始行程代码，请重试");
      }

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "未知错误";
      alert("修改失败: " + message);
    } finally {
      setIsRegenerating(false);
    }
  };

  // ==================== Enhanced Intent Routing ====================

  // Helper: Add chat message
  const addChatMessage = (message: Omit<ChatMessageType, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessageType = {
      ...message,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  // Main routing handler for follow-up inputs
  const handleFollowUpSubmit = async (input: string) => {
    if (!input.trim() || !tripSkeleton) return;

    setIsAnalyzingIntent(true);

    // Add user message
    addChatMessage({
      role: 'user',
      content: input
    });

    try {
      const analysis = await analyzeEnhancedIntent(
        initialPrompt,
        input,
        tripSkeleton
      );

      // Route based on intent
      switch (analysis.intent) {
        case FollowUpIntent.REGENERATE_GLOBAL:
          await handleRegenerate(input, analysis);
          break;
        case FollowUpIntent.UPDATE_LOCAL:
          await handleUpdateLocal(input, analysis);
          break;
        case FollowUpIntent.SEARCH:
          await handleSearch(input, analysis);
          break;
        case FollowUpIntent.CHAT:
          await handleChat(input, analysis);
          break;
        case FollowUpIntent.QA_QUERY:
        default:
          await handleQA(input);
          break;
      }
    } catch (error) {
      console.error('Follow-up handling failed:', error);
      addChatMessage({
        role: 'assistant',
        content: '抱歉，处理您的请求时出错了。请重试。'
      });
    } finally {
      setIsAnalyzingIntent(false);
    }
  };

  // Handle local modification with hybrid day selection
  const handleUpdateLocal = async (
    _input: string,
    analysis: EnhancedFollowUpAnalysis
  ) => {
    const { suggestedDay, dayConfidence } = analysis;

    // Hybrid mode: AI recognition + user confirmation
    if (dayConfidence && dayConfidence > 0.7 && suggestedDay && tripSkeleton) {
      // High confidence: show confirmation dialog
      setSuggestedDayForConfirmation(suggestedDay);
      setShowDayConfirmation(true);
    } else {
      // Low confidence: show day selector directly
      setShowDaySelector(true);
    }
  };

  // Handle search queries with confirmation flow
  const handleSearch = async (
    input: string,
    analysis: EnhancedFollowUpAnalysis
  ) => {
    const searchQuery = analysis.searchQuery || input;
    // const category = analysis.searchCategory || 'attraction'; // Reserved for future use

    addChatMessage({
      role: 'assistant',
      content: `正在为您搜索"${searchQuery}"...`,
      type: 'text'
    });

    try {
      const result = await AmapService.searchPlace(
        searchQuery,
        tripSkeleton?.destination || ''
      );

      if (result) {
        addChatMessage({
          role: 'assistant',
          content: `为您找到1个相关结果：\n\n${result.name}\n${result.address || ''}`,
          type: 'text'
        });
      } else {
        addChatMessage({
          role: 'assistant',
          content: `未找到与"${searchQuery}"相关的结果。您可以尝试其他关键词，或者告诉我您想搜索什么类型的地点。`
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      addChatMessage({
        role: 'assistant',
        content: '搜索失败，请重试。您可以尝试描述更具体的位置名称。'
      });
    }
  };

  // Handle casual chat
  const handleChat = async (
    _input: string,
    _analysis: EnhancedFollowUpAnalysis
  ) => {
    const responses = [
      '不客气！如果您有其他问题或需要调整行程，随时告诉我～',
      '好的！有任何需要帮助的地方请说～',
      '明白了！还有其他想了解的吗？',
      '收到～如果您对行程有任何想法，随时告诉我！'
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    addChatMessage({
      role: 'assistant',
      content: response
    });
  };

  // Handle QA queries
  const handleQA = async (input: string) => {
    try {
      const result = await generateQAReply(initialPrompt, input, tripSkeleton);
      addChatMessage({
        role: 'assistant',
        content: result.reply
      });
    } catch (error) {
      console.error('QA failed:', error);
      addChatMessage({
        role: 'assistant',
        content: '抱歉，我暂时无法回答这个问题。您可以尝试调整行程，或提供更多细节。'
      });
    }
  };

  // Handle global regeneration
  const handleRegenerate = async (
    _input: string,
    _analysis: EnhancedFollowUpAnalysis
  ) => {
    addChatMessage({
      role: 'assistant',
      content: '好的，我来重新为您规划整个行程...'
    });

    // Reset to initial state and start over
    setTimeout(() => {
      setLoadingState(LoadingState.IDLE);
      setGeneratedHtml(null);
      setTripSkeleton(null);
      setChatMessages([]);
    }, 1000);
  };

  // Regenerate specific day after confirmation
  const regenerateDayWithConfirmation = async (day: number, input: string) => {
    if (!tripSkeleton || !generatedHtml) return;

    setIsRegenerating(true);
    setShowDayConfirmation(false);
    setShowDaySelector(false);

    try {
      const newDayHtml = await regenerateDayPlan(tripSkeleton, day, input);
      const regex = new RegExp(`<section id="day-${day}"[\\s\\S]*?<\\/section>`, 'i');

      if (regex.test(generatedHtml)) {
        const updatedHtml = generatedHtml.replace(regex, newDayHtml);
        setGeneratedHtml(updatedHtml);

        addChatMessage({
          role: 'assistant',
          content: `第${day}天的行程已更新！还有其他需要调整的吗？`
        });
      } else {
        throw new Error('无法定位原始行程代码');
      }
    } catch (error) {
      console.error('Day regeneration failed:', error);
      addChatMessage({
        role: 'assistant',
        content: '修改失败，请重试。'
      });
    } finally {
      setIsRegenerating(false);
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

  const getSimulatedLink = () => `https://wanderlust.ai/plan/${Math.random().toString(36).substring(2, 9)}`;

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Planning my trip with Wanderlust AI! 🌍✈️`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(getSimulatedLink())}`, '_blank');
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getSimulatedLink()).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const submitFeedback = () => {
    setIsFeedbackSubmitted(true);
    setTimeout(() => setShowFeedback(false), 2000);
  };

  // ==================== Version Management & Feedback ====================

  /**
   * Handle feedback submission from FeedbackCollector
   */
  const handleFeedbackSubmit = async (feedback: Omit<UserFeedback, 'id' | 'timestamp' | 'status'>) => {
    if (!tripSkeleton) return;

    const feedbackAgent = createFeedbackAgent();

    try {
      // Analyze the feedback
      const analysis = await feedbackAgent.analyzeFeedback(
        feedback.content,
        feedback.targetDay || null,
        tripSkeleton
      );

      // Generate friendly response
      const response = await feedbackAgent.generateModificationResponse(
        feedback.content,
        analysis,
        tripSkeleton
      );

      // Add AI response to chat
      addChatMessage({
        role: 'assistant',
        content: response
      });

      // Create new version with changes
      const previousVersion = versionHistory[versionHistory.length - 1];
      const newVersion = feedbackAgent.createVersionHistory(
        tripSkeleton,
        analysis.suggestedChanges,
        feedback.author,
        previousVersion
      );

      setVersionHistory([...versionHistory, newVersion]);

      // Handle regeneration based on analysis
      if (analysis.requiresGlobalRegeneration) {
        addChatMessage({
          role: 'assistant',
          content: '需要重新规划整体行程，请稍候...'
        });

        // Trigger full regeneration (reset to input form)
        setTimeout(() => {
          setLoadingState(LoadingState.IDLE);
          setGeneratedHtml(null);
          setTripSkeleton(null);
          setChatMessages([]);
        }, 1500);
      } else if (feedback.targetDay && analysis.targetDays.includes(feedback.targetDay)) {
        // Regenerate specific day
        setIsRegenerating(true);

        try {
          const newDayHtml = await regenerateDayPlan(
            tripSkeleton,
            feedback.targetDay,
            feedback.content
          );

          if (generatedHtml) {
            const regex = new RegExp(`<section id="day-${feedback.targetDay}"[\\s\\S]*?<\\/section>`, 'i');

            if (regex.test(generatedHtml)) {
              const updatedHtml = generatedHtml.replace(regex, newDayHtml);
              setGeneratedHtml(updatedHtml);

              addChatMessage({
                role: 'assistant',
                content: `第${feedback.targetDay}天的行程已更新！还有其他需要调整的吗？`
              });
            }
          }
        } catch (error) {
          console.error('Day regeneration failed:', error);
          addChatMessage({
            role: 'assistant',
            content: '修改失败，请重试。'
          });
        } finally {
          setIsRegenerating(false);
        }
      }

      // Close feedback collector
      setShowFeedbackCollector(false);
      setFeedbackTargetDay(undefined);

    } catch (error) {
      console.error('Feedback handling failed:', error);
      addChatMessage({
        role: 'assistant',
        content: '处理反馈时出错，请重试。'
      });
    }
  };

  /**
   * Handle version restoration
   */
  const handleRestoreVersion = (version: VersionHistory) => {
    if (!version.skeleton) return;

    // Restore the skeleton from version
    setTripSkeleton(version.skeleton);

    // Regenerate full HTML for the restored version
    // Note: In a real implementation, you'd want to cache the HTML
    // or have a way to regenerate it from the skeleton

    addChatMessage({
      role: 'assistant',
      content: `已回滚到版本 ${version.version} (${version.summary})`
    });

    setShowVersionHistory(false);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-morandi-base overflow-hidden font-sans text-morandi-charcoal">
      
      {/* Sidebar Area */}
      <div className={`
        flex-shrink-0 h-full z-20 relative bg-morandi-base transition-all duration-700 ease-in-out
        ${loadingState === LoadingState.GENERATING || loadingState === LoadingState.SUCCESS
          ? 'w-0 opacity-0 overflow-hidden'
          : 'w-full md:w-[500px] lg:w-[600px]'}
      `}>
        <InputForm 
          onGenerate={handleGenerate} 
          isGenerating={loadingState === LoadingState.GENERATING}
          agentStage={agentStage}
        />
      </div>

      {/* Preview / Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] transition-all duration-700">
        
        {/* Floating Toolbar - Only show when SUCCESS */}
        {loadingState === LoadingState.SUCCESS && generatedHtml && (
          <div className="absolute top-6 right-8 z-30 flex gap-3 animate-slide-up">

             {/* Regenerate Button */}
             <button
               onClick={() => {
                 setLoadingState(LoadingState.IDLE);
                 setGeneratedHtml(null);
                 setTripSkeleton(null);
                 setModifyingDay(null);
               }}
               className="group flex items-center justify-center w-12 h-12 bg-white
                          text-morandi-charcoal rounded-full shadow-float
                          hover:shadow-xl hover:scale-105 transition-all
                          border border-morandi-base"
               title="重新规划"
             >
               <RotateCcw size={18} className="text-morandi-slate group-hover:text-morandi-charcoal transition-colors" />
             </button>

             {/* Version History Button */}
             {versionHistory.length > 1 && (
               <button
                 onClick={() => setShowVersionHistory(!showVersionHistory)}
                 className="group flex items-center justify-center w-12 h-12 bg-white
                          text-morandi-charcoal rounded-full shadow-float
                          hover:shadow-xl hover:scale-105 transition-all
                          border border-morandi-base"
                 title="版本历史"
               >
                 <History size={18} className="text-morandi-slate group-hover:text-morandi-charcoal transition-colors" />
                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-morandi-sage text-white text-xs font-bold rounded-full flex items-center justify-center">
                   {versionHistory.length}
                 </span>
               </button>
             )}

             {/* Feedback Button */}
             <button
                onClick={() => setShowFeedbackCollector(true)}
                className="group flex items-center justify-center w-12 h-12 bg-white text-morandi-charcoal rounded-full shadow-float hover:shadow-xl hover:scale-105 transition-all border border-morandi-base"
                title="反馈与建议"
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
                      <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-morandi-base rounded-lg transition-colors text-left">
                        <div className="p-2 bg-morandi-base rounded-lg text-morandi-slate">
                          {copiedLink ? <Check size={16} className="text-green-600" /> : <LinkIcon size={16} />}
                        </div>
                        <span className="font-medium">{copiedLink ? "已复制链接" : "复制链接"}</span>
                      </button>
                      <button onClick={handleShareTwitter} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-morandi-base rounded-lg transition-colors text-left">
                        <div className="p-1.5 bg-sky-50 rounded-lg text-sky-500"><Twitter size={16} /></div>
                        <span className="font-medium">Twitter</span>
                      </button>
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
                  <span>导出</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-morandi-base overflow-hidden animate-scale-in origin-top-right z-40">
                    <div className="p-1">
                      <button onClick={handleDownloadHtml} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-morandi-base rounded-lg transition-colors text-left">
                        <div className="p-2 bg-morandi-base rounded-lg text-morandi-slate"><FileCode size={16} /></div>
                        <span className="font-medium">HTML 源码</span>
                      </button>
                      <button onClick={handlePrintPdf} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-morandi-base rounded-lg transition-colors text-left">
                        <div className="p-2 bg-morandi-base rounded-lg text-morandi-slate"><Printer size={16} /></div>
                        <span className="font-medium">另存为 PDF</span>
                      </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* MODIFY MODAL */}
        {modifyingDay !== null && (
          <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center bg-black/30 backdrop-blur-sm animate-fade-in p-4">
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-morandi-base animate-scale-in flex flex-col">
                <div className="p-4 border-b border-morandi-base flex justify-between items-center bg-morandi-base/30">
                   <div className="flex items-center gap-2">
                     <Edit3 size={18} className="text-morandi-slate" />
                     <h3 className="font-bold text-morandi-charcoal">修改第 {modifyingDay} 天行程</h3>
                   </div>
                   <button onClick={() => setModifyingDay(null)} className="p-1 hover:bg-morandi-base rounded-full transition-colors"><X size={18} /></button>
                </div>
                
                <div className="p-6">
                   <p className="text-sm text-morandi-slate mb-4">
                     请输入您的修改意见（例如：更换晚餐为米其林餐厅、增加下午茶、行程太赶了想轻松点...）
                   </p>
                   <textarea
                      value={modifyInput}
                      onChange={(e) => setModifyInput(e.target.value)}
                      className="w-full h-32 p-3 bg-morandi-base/30 rounded-xl border border-morandi-base focus:ring-2 focus:ring-morandi-sage focus:border-transparent resize-none text-morandi-charcoal placeholder-morandi-dust"
                      placeholder="我想把上午的行程改为..."
                      autoFocus
                   />
                </div>
                
                <div className="p-4 bg-morandi-base/20 border-t border-morandi-base flex justify-end gap-3">
                   <button 
                     onClick={() => setModifyingDay(null)}
                     disabled={isRegenerating}
                     className="px-4 py-2 rounded-lg text-sm font-medium text-morandi-slate hover:bg-morandi-base transition-colors"
                   >
                     取消
                   </button>
                   <button 
                     onClick={submitModification}
                     disabled={isRegenerating || !modifyInput.trim()}
                     className="px-6 py-2 rounded-lg text-sm font-medium bg-morandi-charcoal text-white hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                     {isRegenerating ? (
                       <><Loader2 size={14} className="animate-spin" /> 正在规划...</>
                     ) : (
                       <><Send size={14} /> 确认修改</>
                     )}
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Feedback Modal Overlay */}
        {showFeedback && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
                <div ref={feedbackRef} className="bg-white rounded-2xl p-6 shadow-2xl w-80 md:w-96 transform transition-all animate-scale-in relative border border-morandi-base">
                    <button onClick={() => setShowFeedback(false)} className="absolute top-4 right-4 text-morandi-dust hover:text-morandi-charcoal transition-colors"><X size={18} /></button>
                    {!isFeedbackSubmitted ? (
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-bold text-morandi-charcoal mb-1">评价生成的行程</h3>
                            <div className="flex gap-2 mb-6 mt-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110 focus:outline-none">
                                        <Star size={28} className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-morandi-base fill-morandi-base'}`} />
                                    </button>
                                ))}
                            </div>
                            <button onClick={submitFeedback} disabled={rating === 0} className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${rating > 0 ? 'bg-morandi-charcoal text-white' : 'bg-morandi-base text-morandi-dust cursor-not-allowed'}`}><span>提交</span><Send size={14} /></button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8 animate-fade-in">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3"><Check size={24} /></div>
                            <h3 className="text-lg font-bold text-morandi-charcoal">感谢反馈</h3>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Content Container */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          
          {loadingState === LoadingState.IDLE && (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 bg-gradient-to-br from-morandi-base/30 via-morandi-clay/10 to-morandi-base/30 relative overflow-hidden">
               {/* Animated Blob Backgrounds */}
               <div className="absolute top-20 left-20 w-64 h-64 bg-morandi-sage/20 rounded-full blur-3xl animate-blob"></div>
               <div className="absolute bottom-20 right-20 w-80 h-80 bg-morandi-accent/15 rounded-full blur-3xl animate-blob" style={{animationDelay: '2s'}}></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-morandi-clay/10 rounded-full blur-3xl animate-blob" style={{animationDelay: '4s'}}></div>

               {/* Floating Particles */}
               <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-morandi-sage/30 rounded-full animate-float-gentle"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${3 + Math.random() * 2}s`
                      }}
                    />
                  ))}
               </div>

               {/* Large Background Text */}
               <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-5 pointer-events-none select-none">
                 <span className="text-[25vw] font-serif italic text-morandi-clay animate-float">Plan</span>
               </div>

               {/* Main Content */}
               <div className="relative z-10 max-w-2xl text-center space-y-10 animate-fade-in">
                  {/* Icon with Pulse Ring */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-morandi-sage/30 rounded-full animate-pulse-ring"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-morandi-sage to-morandi-clay rounded-2xl flex items-center justify-center shadow-glow rotate-slow">
                        <Sparkles size={36} className="text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Title with Shimmer */}
                  <div className="space-y-4">
                    <h2 className="text-4xl font-serif italic text-morandi-charcoal tracking-tight">
                      <span className="relative inline-block">
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-12deg] animate-shimmer"></span>
                        Wanderlust AI
                      </span>
                    </h2>
                    <p className="text-morandi-slate font-light text-lg leading-relaxed">
                      Multi-Agent 旅行规划系统
                    </p>
                    <p className="text-morandi-dust text-sm max-w-md mx-auto leading-relaxed">
                      基于中枢调度的 Agent 架构<br/>确保从第一天到最后天的细节完美一致。
                    </p>
                  </div>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap justify-center gap-3 pt-4">
                    {['智能调度', '实时核验', '路径优化', '可视化报告'].map((feature, i) => (
                      <span
                        key={feature}
                        className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-xs font-medium text-morandi-slate border border-white/60 shadow-sm animate-slide-up hover:shadow-md hover:bg-white/80 transition-all cursor-default"
                        style={{ animationDelay: `${0.5 + i * 0.1}s` }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {/*
            CRITICAL UI CHANGE:
            Show AgentLoadingScreen if GENERATING (Streaming)
            Replaced ThinkingConsole with immersive single-screen experience
          */}
          {loadingState === LoadingState.GENERATING && (
            <AgentLoadingScreen
              agentStage={agentStage}
              logs={consoleLogs}
              startTime={generationStartTime || undefined}
              onCancel={() => setShowCancelConfirm(true)}
              skeletonData={skeletonData}
              currentPhase={currentPhase}
              progress={renderProgress}
            />
          )}

          {/* Cancel Confirmation Modal */}
          {showCancelConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-morandi-base animate-scale-in">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-morandi-charcoal mb-2">中断规划</h3>
                  <p className="text-sm text-morandi-slate mb-6">
                    确定要中断当前规划吗？已生成的内容将会丢失。
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setLoadingState(LoadingState.IDLE);
                        setGeneratedHtml(null);
                        setTripSkeleton(null);
                        setConsoleLogs("");
                        setShowCancelConfirm(false);
                      }}
                      className="flex-1 py-2.5 bg-morandi-charcoal text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                    >
                      确定中断
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 py-2.5 bg-morandi-base text-morandi-slate rounded-lg text-sm font-medium hover:bg-morandi-clay/50 transition-colors"
                    >
                      继续规划
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loadingState === LoadingState.ERROR && (
            <div className="h-full flex flex-col items-center justify-center bg-white">
              <div className="p-8 rounded-3xl bg-red-50 text-red-800 flex flex-col items-center gap-4 max-w-md text-center animate-slide-up">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-2xl">⚠️</div>
                <h3 className="text-lg font-bold">生成中断</h3>
                <p className="text-sm opacity-80 break-words">{errorMsg}</p>
                <button onClick={() => setLoadingState(LoadingState.IDLE)} className="px-6 py-2 bg-white border border-red-200 rounded-full text-sm font-medium hover:bg-red-50 transition-colors">重试</button>
              </div>
            </div>
          )}

          {/* Show Preview ONLY when SUCCESS and we have HTML */}
          {loadingState === LoadingState.SUCCESS && generatedHtml && (
             <div className="w-full h-full bg-white animate-fade-in origin-bottom relative">
                <PlanPreview
                  ref={planPreviewRef}
                  htmlContent={generatedHtml}
                />

                {/* Report Chat Panel - Only show when report is displayed */}
                <ReportChatPanel
                  initialPrompt={initialPrompt}
                  tripSkeleton={tripSkeleton}
                  onSubmit={handleFollowUpSubmit}
                  isAnalyzing={isAnalyzingIntent}
                  isRegenerating={isRegenerating}
                />
             </div>
          )}
        </div>

        {/* Day Selector Modal */}
        {showDaySelector && tripSkeleton && (
          <DaySelector
            days={tripSkeleton.days}
            onSelect={(day) => {
              // Get the last user message for modification context
              const lastUserMsg = chatMessages.filter(m => m.role === 'user').pop();
              const input = lastUserMsg?.content || '';
              regenerateDayWithConfirmation(day, input);
            }}
            onCancel={() => setShowDaySelector(false)}
          />
        )}

        {/* Day Confirmation Modal */}
        {showDayConfirmation && suggestedDayForConfirmation && tripSkeleton && (
          <DayConfirmation
            suggestedDay={suggestedDayForConfirmation}
            dayTitle={tripSkeleton.days.find(d => d.day === suggestedDayForConfirmation)?.title || `第${suggestedDayForConfirmation}天`}
            onConfirm={() => {
              const lastUserMsg = chatMessages.filter(m => m.role === 'user').pop();
              const input = lastUserMsg?.content || '';
              regenerateDayWithConfirmation(suggestedDayForConfirmation, input);
            }}
            onDeny={() => {
              setShowDayConfirmation(false);
              setShowDaySelector(true);
            }}
          />
        )}

        {/* Version History Modal */}
        {showVersionHistory && versionHistory.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden border border-morandi-base animate-scale-in flex flex-col">
              <div className="p-4 border-b border-morandi-base flex justify-between items-center bg-morandi-base/30">
                <div className="flex items-center gap-2">
                  <GitCompare size={18} className="text-morandi-slate" />
                  <h3 className="font-bold text-morandi-charcoal">版本历史</h3>
                  <span className="text-xs text-morandi-dust bg-morandi-base px-2 py-0.5 rounded-full">
                    {versionHistory.length} 个版本
                  </span>
                </div>
                <button onClick={() => setShowVersionHistory(false)} className="p-1 hover:bg-morandi-base rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {versionHistory.slice().reverse().map((version, index) => {
                  const isLatest = index === 0;
                  const previousVersion = versionHistory[versionHistory.length - 1 - index];

                  return (
                    <div
                      key={version.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isLatest
                          ? 'bg-morandi-sage/10 border-morandi-sage'
                          : 'bg-morandi-base/20 border-morandi-base hover:bg-morandi-base/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isLatest ? 'text-morandi-sage' : 'text-morandi-charcoal'}`}>
                            V{version.version}
                          </span>
                          {isLatest && (
                            <span className="text-xs px-2 py-0.5 bg-morandi-sage text-white rounded-full">当前</span>
                          )}
                        </div>
                        <span className="text-xs text-morandi-dust">
                          {new Date(version.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>

                      <div className="text-sm text-morandi-slate mb-2">
                        <span className="font-medium text-morandi-charcoal">作者：</span>
                        {version.author}
                      </div>

                      <div className="text-sm text-morandi-charcoal mb-2">
                        {version.summary}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {version.changes.slice(0, 3).map((change, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              change.type === 'global'
                                ? 'bg-purple-100 text-purple-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            {change.type === 'global' ? '全局' : `Day ${change.day}`}
                          </span>
                        ))}
                        {version.changes.length > 3 && (
                          <span className="text-xs text-morandi-dust px-2 py-0.5">
                            +{version.changes.length - 3} 更多
                          </span>
                        )}
                      </div>

                      {!isLatest && previousVersion && (
                        <div className="pt-2 border-t border-morandi-base/50">
                          <button
                            onClick={() => {
                              if (window.confirm(`确定要回滚到版本 ${version.version} 吗？当前版本将作为新版本保存。`)) {
                                handleRestoreVersion(version);
                              }
                            }}
                            className="text-xs text-morandi-sage hover:text-morandi-clay font-medium flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw size={12} />
                            回滚到此版本
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Version Diff Viewer */}
              {versionHistory.length > 1 && (
                <div className="p-4 border-t border-morandi-base bg-morandi-base/20">
                  <VersionDiffViewer
                    currentVersion={versionHistory[versionHistory.length - 1]}
                    previousVersion={versionHistory[versionHistory.length - 2]}
                    onRestore={handleRestoreVersion}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Collector Modal */}
        {showFeedbackCollector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4">
            <div className="animate-scale-in">
              <FeedbackCollector
                targetDay={feedbackTargetDay}
                onSubmit={handleFeedbackSubmit}
                onClose={() => {
                  setShowFeedbackCollector(false);
                  setFeedbackTargetDay(undefined);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
