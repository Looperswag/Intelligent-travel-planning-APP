/**
 * SkeletonLoader - 骨架屏加载组件
 *
 * 功能：
 * 1. 在生成开始时立即显示，提供即时反馈
 * 2. 显示关键信息（目的地、天数、场景类型）
 * 3. 动态展示加载进度
 * 4. 预告预计等待时间
 *
 * 目标：TTFB < 0.5s
 */

import React, { useEffect, useState } from 'react';
import { SkeletonData, SceneType, RenderPhase } from '../types';
import { SceneIcon } from './icons/SceneIcon';
import { SCENE_ICONS, PHASE_ICONS } from './icons/mappings';
import { Search, Clipboard, MapPin, Sparkles, Calendar } from 'lucide-react';

interface SkeletonLoaderProps {
  skeletonData: SkeletonData;
  currentPhase?: RenderPhase;
  progress?: number; // 0-100
}

/**
 * 场景类型对应的色系
 */
const SCENE_COLORS: Record<SceneType, { primary: string; secondary: string }> = {
  [SceneType.ROMANTIC]: { primary: 'bg-rose-500', secondary: 'bg-rose-100' },
  [SceneType.FAMILY]: { primary: 'bg-amber-500', secondary: 'bg-amber-100' },
  [SceneType.ADVENTURE]: { primary: 'bg-emerald-500', secondary: 'bg-emerald-100' },
  [SceneType.BUSINESS]: { primary: 'bg-slate-700', secondary: 'bg-slate-100' },
  [SceneType.FOODIE]: { primary: 'bg-orange-500', secondary: 'bg-orange-100' },
  [SceneType.CULTURE]: { primary: 'bg-indigo-500', secondary: 'bg-indigo-100' },
  [SceneType.RELAXATION]: { primary: 'bg-teal-500', secondary: 'bg-teal-100' },
  [SceneType.SOLO]: { primary: 'bg-blue-500', secondary: 'bg-blue-100' }
};

/**
 * 骨架屏组件
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  skeletonData,
  currentPhase = RenderPhase.SKELETON,
  progress = 0
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [dots, setDots] = useState('');

  // 动画进度
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        if (prev < progress) {
          return Math.min(prev + 2, progress);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [progress]);

  // 加载点动画
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const sceneColor = SCENE_COLORS[skeletonData.sceneType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* 主卡片 */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* 头部渐变区域 */}
          <div className={`${sceneColor.primary} h-32 relative overflow-hidden`}>
            {/* 动态背景图案 */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
            </div>

            {/* 场景图标 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <SceneIcon
                sceneType={skeletonData.sceneType}
                size="3xl"
                color="white"
                className="w-16 h-16 animate-pulse"
              />
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-8 space-y-6">
            {/* 目的地标题 */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-slate-800">
                {skeletonData.destination}
              </h1>
              <p className="text-lg text-slate-500">
                {skeletonData.duration} 天旅程
              </p>
            </div>

            {/* 场景标签 */}
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${sceneColor.secondary} text-slate-700 mx-auto block w-fit`}>
              <SceneIcon
                sceneType={skeletonData.sceneType}
                size="md"
                color="secondary"
                className="mr-2"
              />
              <span className="font-medium capitalize">{skeletonData.sceneType}</span>
            </div>

            {/* 旅行氛围描述 */}
            <div className="text-center">
              <p className="text-slate-600 italic">"{skeletonData.vibe}"</p>
            </div>

            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>正在规划你的旅程{dots}</span>
                <span>{animatedProgress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${sceneColor.primary} transition-all duration-300 ease-out`}
                  style={{ width: `${animatedProgress}%` }}
                >
                  <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
                </div>
              </div>
            </div>

            {/* 预计时间 */}
            <div className="flex items-center justify-center space-x-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">预计约 {skeletonData.estimatedTime} 秒</span>
            </div>

            {/* 当前阶段指示器 */}
            <PhaseIndicator currentPhase={currentPhase} />

            {/* 提示信息 */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600 text-center">
                AI正在为你搜索最佳路线和景点，请稍候...
              </p>
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-4 text-center text-slate-400 text-sm">
          Wanderlust AI Planner
        </div>
      </div>

      {/* 自定义动画样式 */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * 阶段指示器组件
 */
interface PhaseIndicatorProps {
  currentPhase: RenderPhase;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase }) => {
  const phases = [
    { key: RenderPhase.SKELETON, label: '分析需求', icon: Search },
    { key: RenderPhase.HEADER, label: '生成框架', icon: Clipboard },
    { key: RenderPhase.OVERVIEW, label: '规划概览', icon: MapPin },
    { key: RenderPhase.DAY_1, label: '第一天行程', icon: Sparkles },
    { key: RenderPhase.REMAINING, label: '完善细节', icon: Calendar }
  ];

  const currentIndex = phases.findIndex(p => p.key === currentPhase);

  return (
    <div className="flex items-center justify-center space-x-2">
      {phases.map((phase, index) => (
        <React.Fragment key={phase.key}>
          {/* 阶段圆点 */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                index <= currentIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              <phase.icon className="w-4 h-4" />
            </div>
            <span
              className={`text-xs mt-1 transition-all duration-300 ${
                index <= currentIndex ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              {phase.label}
            </span>
          </div>

          {/* 连接线 */}
          {index < phases.length - 1 && (
            <div
              className={`h-0.5 w-8 transition-all duration-300 ${
                index < currentIndex ? 'bg-blue-500' : 'bg-slate-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default SkeletonLoader;
