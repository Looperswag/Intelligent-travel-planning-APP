
export interface TripDetails {
  prompt: string; // Unified input for the LLM to parse
}

export interface SocialLink {
  id: string;
  url: string;
  type: 'link';
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  type: 'image' | 'video';
}

export type MediaItem = SocialLink | UploadedFile;

export enum LoadingState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// 基于 PDF 架构定义的 Agent 工作流阶段
export enum AgentStage {
  IDLE = 'IDLE',
  INGESTING = 'INGESTING',   // 解析需求 & 灵感提取
  RESEARCHING = 'RESEARCHING', // Web Search & 事实核验 (Evidence)
  PLANNING = 'PLANNING',     // 路径规划 & 可行性计算
  FINALIZING = 'FINALIZING'  // 生成最终 UI
}
