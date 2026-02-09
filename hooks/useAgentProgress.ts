/**
 * useAgentProgress Hook
 *
 * Manages agent progress tracking and state.
 * Extracted from App.tsx to improve code organization.
 */

import { useState, useCallback } from 'react';
import { AgentStage, RenderPhase } from '../types';

export interface UseAgentProgressReturn {
  agentStage: AgentStage;
  currentPhase: RenderPhase;
  renderProgress: number;
  consoleLogs: string;
  setAgentStage: (stage: AgentStage) => void;
  setCurrentPhase: (phase: RenderPhase) => void;
  setRenderProgress: (progress: number) => void;
  setConsoleLogs: (logs: string) => void;
  addConsoleLog: (log: string) => void;
  resetProgress: () => void;
}

export const useAgentProgress = (): UseAgentProgressReturn => {
  const [agentStage, setAgentStage] = useState<AgentStage>(AgentStage.IDLE);
  const [currentPhase, setCurrentPhase] = useState<RenderPhase>(RenderPhase.SKELETON);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [consoleLogs, setConsoleLogs] = useState<string>("");

  const addConsoleLog = useCallback((log: string) => {
    setConsoleLogs(prev => prev + log);
  }, []);

  const resetProgress = useCallback(() => {
    setAgentStage(AgentStage.IDLE);
    setCurrentPhase(RenderPhase.SKELETON);
    setRenderProgress(0);
    setConsoleLogs("");
  }, []);

  return {
    agentStage,
    currentPhase,
    renderProgress,
    consoleLogs,
    setAgentStage,
    setCurrentPhase,
    setRenderProgress,
    setConsoleLogs,
    addConsoleLog,
    resetProgress
  };
};
