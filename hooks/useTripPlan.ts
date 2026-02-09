/**
 * useTripPlan Hook
 *
 * Manages trip plan generation state and logic.
 * Extracted from App.tsx to reduce complexity and improve maintainability.
 */

import { useState, useCallback } from 'react';
import {
  LoadingState,
  AgentStage,
  TripSkeleton,
  TripDetails,
  MediaItem,
  RenderPhase,
  SkeletonData,
  VersionHistory,
  UserFeedback
} from '../types';
import { generateTravelPlanStream } from '../services/glmService';
import { createFeedbackAgent } from '../services/agent/feedbackAgent';

export interface UseTripPlanReturn {
  // State
  loadingState: LoadingState;
  agentStage: AgentStage;
  errorMsg: string | null;
  generatedHtml: string | null;
  consoleLogs: string;
  tripSkeleton: TripSkeleton | null;
  skeletonData: SkeletonData | null;
  currentPhase: RenderPhase;
  renderProgress: number;
  generationStartTime: number | null;
  versionHistory: VersionHistory[];

  // Actions
  generatePlan: (details: TripDetails, mediaItems: MediaItem[]) => Promise<void>;
  resetPlan: () => void;
  setError: (msg: string | null) => void;
  setGeneratedHtml: (html: string | null) => void;
  addVersion: (version: VersionHistory) => void;
}

export const useTripPlan = (): UseTripPlanReturn => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [agentStage, setAgentStage] = useState<AgentStage>(AgentStage.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string>("");
  const [tripSkeleton, setTripSkeleton] = useState<TripSkeleton | null>(null);
  const [skeletonData, setSkeletonData] = useState<SkeletonData | null>(null);
  const [currentPhase, setCurrentPhase] = useState<RenderPhase>(RenderPhase.SKELETON);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);

  const resetPlan = useCallback(() => {
    setLoadingState(LoadingState.IDLE);
    setAgentStage(AgentStage.IDLE);
    setErrorMsg(null);
    setGeneratedHtml(null);
    setConsoleLogs("");
    setTripSkeleton(null);
    setSkeletonData(null);
    setCurrentPhase(RenderPhase.SKELETON);
    setRenderProgress(0);
    setGenerationStartTime(null);
  }, []);

  const setError = useCallback((msg: string | null) => {
    setErrorMsg(msg);
  }, []);

  const addVersion = useCallback((version: VersionHistory) => {
    setVersionHistory(prev => [...prev, version]);
  }, []);

  const generatePlan = useCallback(async (details: TripDetails, mediaItems: MediaItem[]) => {
    setLoadingState(LoadingState.GENERATING);
    setConsoleLogs("");
    setGeneratedHtml(null);
    setErrorMsg(null);
    setAgentStage(AgentStage.INGESTING);
    setTripSkeleton(null);
    setGenerationStartTime(Date.now());
    setSkeletonData(null);
    setCurrentPhase(RenderPhase.SKELETON);
    setRenderProgress(0);

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
          const jsonStr = chunk.replace("<<<SKELETON>>>", "");
          try {
            const skeleton = JSON.parse(jsonStr);
            setTripSkeleton(skeleton);

            const skelData: SkeletonData = {
              destination: skeleton.destination,
              duration: skeleton.duration,
              sceneType: skeleton.sceneType || 'relaxation',
              estimatedTime: Math.floor(skeleton.duration * 4),
              vibe: skeleton.vibe
            };
            setSkeletonData(skelData);
          } catch (e) {
            console.error("Failed to parse skeleton", e);
          }
        } else if (chunk.startsWith(">>>")) {
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

      // Save initial version to version history
      const skeleton = tripSkeleton || (fullContent ? null : null);
      if (skeleton) {
        const feedbackAgent = createFeedbackAgent();
        const initialVersion = feedbackAgent.createVersionHistory(
          skeleton,
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
  }, [tripSkeleton]);

  return {
    loadingState,
    agentStage,
    errorMsg,
    generatedHtml,
    consoleLogs,
    tripSkeleton,
    skeletonData,
    currentPhase,
    renderProgress,
    generationStartTime,
    versionHistory,
    generatePlan,
    resetPlan,
    setError,
    setGeneratedHtml,
    addVersion
  };
};
