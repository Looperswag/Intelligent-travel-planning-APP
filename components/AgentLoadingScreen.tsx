import { useState, useEffect } from 'react';
import { X, BrainCircuit, Search, Route, FileCode, Loader2 } from 'lucide-react';
import { AgentStage, RenderPhase, SkeletonData } from '../types';
import SkeletonLoader from './SkeletonLoader';

interface AgentLoadingScreenProps {
  agentStage: AgentStage;
  logs?: string;
  startTime?: number;
  onCancel: () => void;
  skeletonData?: SkeletonData | null;
  currentPhase?: RenderPhase;
  progress?: number;
}

// 阶段持续时间估算（毫秒）
const STAGE_DURATION = {
  INGESTING: 10000,    // 10秒
  RESEARCHING: 20000,  // 20秒
  PLANNING: 25000,     // 25秒
  FINALIZING: 15000    // 15秒
};

// 阶段权重（用于计算百分比） - 预留用于未来功能
// const _STAGE_WEIGHT = {
//   INGESTING: 15,
//   RESEARCHING: 35,
//   PLANNING: 35,
//   FINALIZING: 15
// };

// 阶段内容配置
const STAGE_CONTENT = {
  INGESTING: {
    icon: BrainCircuit,
    title: '正在理解你的旅行愿望',
    description: 'AI 正在深度分析你的需求，提取关键灵感...',
    color: 'morandi-sage'
  },
  RESEARCHING: {
    icon: Search,
    title: '全网搜证中',
    description: '正在验证景点信息、查询开放时间、确认交通方案...',
    color: 'morandi-accent'
  },
  PLANNING: {
    icon: Route,
    title: '路线优化计算中',
    description: '正在计算最优路径，平衡行程节奏与体验...',
    color: 'morandi-clay'
  },
  FINALIZING: {
    icon: FileCode,
    title: '生成旅行报告',
    description: '正在渲染精美的可视化报告...',
    color: 'morandi-slate'
  }
};

export const AgentLoadingScreen: React.FC<AgentLoadingScreenProps> = ({
  agentStage,
  logs: _logs,
  startTime = Date.now(),
  onCancel,
  skeletonData,
  currentPhase,
  progress
}) => {
  const [_elapsed, setElapsed] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // 当有骨架数据时，延迟显示骨架屏
  useEffect(() => {
    if (skeletonData && !showSkeleton) {
      const timer = setTimeout(() => setShowSkeleton(true), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [skeletonData, showSkeleton]);

  // 更新经过时间 - 移到条件性 return 之前
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // 计算剩余时间
  const calculateRemainingTime = (): string => {
    const stages: AgentStage[] = [AgentStage.INGESTING, AgentStage.RESEARCHING, AgentStage.PLANNING, AgentStage.FINALIZING];
    const currentIndex = stages.indexOf(agentStage);

    // 计算已完成阶段的时间
    let completedTime = 0;
    for (let i = 0; i < currentIndex; i++) {
      completedTime += STAGE_DURATION[stages[i] as keyof typeof STAGE_DURATION];
    }

    // 当前阶段的假设进度（50%）
    const currentStageProgress = STAGE_DURATION[agentStage as keyof typeof STAGE_DURATION] * 0.5;
    const expectedElapsed = completedTime + currentStageProgress;

    // 总预计时间
    const totalEstimated = Object.values(STAGE_DURATION).reduce((a, b) => a + b, 0);

    const remaining = Math.max(0, totalEstimated - expectedElapsed);

    if (remaining < 60000) {
      return `预计还需 ${Math.ceil(remaining / 1000)} 秒`;
    } else {
      return `预计还需 ${Math.ceil(remaining / 60000)} 分钟`;
    }
  };

  const currentContent = STAGE_CONTENT[agentStage as keyof typeof STAGE_CONTENT] || STAGE_CONTENT.INGESTING;
  const CurrentIcon = currentContent.icon;

  // 如果有骨架数据且已过延迟，显示骨架屏
  if (skeletonData && showSkeleton) {
    return (
      <div className="h-screen w-full relative">
        <SkeletonLoader
          skeletonData={skeletonData}
          currentPhase={currentPhase}
          progress={progress || 0}
        />
        {/* 取消按钮 */}
        <button
          onClick={onCancel}
          className="absolute bottom-8 right-8 p-3 bg-white/80 backdrop-blur-xl
                     rounded-full shadow-md hover:shadow-lg hover:scale-105
                     border border-white/50 transition-all duration-300 z-50"
          title="取消规划"
        >
          <X size={18} className="text-slate-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center
                  bg-gradient-to-br from-morandi-base via-morandi-clay/10 to-morandi-base
                  relative overflow-hidden">

      {/* Blob 动画背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-morandi-sage/20
                    rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-morandi-accent/15
                    rounded-full blur-3xl animate-blob"
                    style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-96 h-96 bg-morandi-clay/10 rounded-full blur-3xl animate-blob"
                    style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 粒子效果 */}
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

      {/* 主内容 */}
      <div className="relative z-10 w-full max-w-2xl px-6">

        {/* 阶段进度条 */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3">
            <StageProgressDot
              stage={AgentStage.INGESTING}
              current={agentStage}
            />
            <div className="w-8 h-0.5 bg-morandi-dust rounded-full"></div>
            <StageProgressDot
              stage={AgentStage.RESEARCHING}
              current={agentStage}
            />
            <div className="w-8 h-0.5 bg-morandi-dust rounded-full"></div>
            <StageProgressDot
              stage={AgentStage.PLANNING}
              current={agentStage}
            />
            <div className="w-8 h-0.5 bg-morandi-dust rounded-full"></div>
            <StageProgressDot
              stage={AgentStage.FINALIZING}
              current={agentStage}
            />
          </div>
        </div>

        {/* 阶段内容卡片 */}
        <div
          key={agentStage}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-float
                      border border-white/50 p-12
                      animate-scale-in transition-all duration-500"
        >
          {/* 图标 */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-morandi-sage/30 rounded-full animate-pulse-ring"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br
                          from-morandi-sage to-morandi-clay
                          rounded-2xl flex items-center justify-center
                          shadow-glow rotate-slow">
                <CurrentIcon size={40} className="text-white" />
              </div>
            </div>
          </div>

          {/* 标题 */}
          <h2 className="text-2xl font-bold text-morandi-charcoal text-center mb-3">
            {currentContent.title}
          </h2>

          {/* 描述 */}
          <p className="text-morandi-slate text-center text-base leading-relaxed">
            {currentContent.description}
          </p>
        </div>

        {/* 预计时间 */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2
                       bg-white/60 backdrop-blur-sm rounded-full
                       border border-white/50 shadow-sm">
            <Loader2 size={14} className="text-morandi-sage animate-spin" />
            <span className="text-sm text-morandi-slate font-medium">
              {calculateRemainingTime()}
            </span>
          </div>
        </div>
      </div>

      {/* 取消按钮 */}
      <button
        onClick={onCancel}
        className="absolute bottom-8 right-8 p-3 bg-white/80 backdrop-blur-xl
                   rounded-full shadow-md hover:shadow-lg hover:scale-105
                   border border-white/50 transition-all duration-300"
        title="取消规划"
      >
        <X size={18} className="text-morandi-slate" />
      </button>
    </div>
  );
};

// 阶段进度点组件
interface StageProgressDotProps {
  stage: AgentStage;
  current: AgentStage;
}

const StageProgressDot: React.FC<StageProgressDotProps> = ({ stage, current }) => {
  const stages: AgentStage[] = [AgentStage.INGESTING, AgentStage.RESEARCHING, AgentStage.PLANNING, AgentStage.FINALIZING];
  const currentIndex = stages.indexOf(current);
  const stageIndex = stages.indexOf(stage);

  const isCompleted = stageIndex < currentIndex;
  const isCurrent = stage === current;

  const getDotColor = () => {
    if (isCompleted) return 'bg-morandi-sage';
    if (isCurrent) return 'bg-morandi-sage animate-pulse';
    return 'bg-morandi-dust';
  };

  const getDotSize = () => {
    if (isCurrent) return 'w-4 h-4';
    return 'w-3 h-3';
  };

  return (
    <div className="flex flex-col items-center">
      {/* 进度点 */}
      <div className={`rounded-full transition-all duration-500 ${getDotSize()} ${getDotColor()}`}>
        {isCompleted && (
          <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
};
