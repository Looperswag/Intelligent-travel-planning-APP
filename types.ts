
export interface TripDetails {
  prompt: string;
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
  base64?: string; // Made optional - only generate when needed for AI analysis
  mimeType: string;
  type: 'image' | 'video';
  analysis?: MediaAnalysis; // AI analysis result
}

export type MediaItem = SocialLink | UploadedFile;

// ==================== 多模态分析类型 ====================

/**
 * 视觉洞察类型 - 从图片/视频中提取的信息
 */
export interface VisualInsight {
  type: 'landscape' | 'architecture' | 'food' | 'activity' | 'culture' | 'nature' | 'urban';
  description: string;
  confidence: number; // 0-1
  keywords: string[];
}

/**
 * 媒体分析结果 - GLM-4.7 对图片/视频的分析
 */
export interface MediaAnalysis {
  summary: string; // 整体描述
  insights: VisualInsight[]; // 提取的视觉洞察
  preferences: string[]; // 用户偏好（从内容推断）
  destinations: string[]; // 可能的目的地
  mood: string; // 情绪/氛围
  analyzedAt: Date;
}

export enum LoadingState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum AgentStage {
  IDLE = 'IDLE',
  INGESTING = 'INGESTING',
  RESEARCHING = 'RESEARCHING',
  PLANNING = 'PLANNING',
  FINALIZING = 'FINALIZING'
}

export interface FontConfig {
  headingFont: string;
  bodyFont: string;
  googleFontUrl: string;
}

export interface VisualIdentity {
  destination: string;
  duration: number;
  vibe: string;
  palette: string;
  heroStyle: 'centered' | 'magazine' | 'minimal';
  fontConfig: FontConfig;
  heroImage?: string;
  sceneType?: SceneType;
}

export interface DayPlanSkeleton {
  day: number;
  title: string;
  theme: string;
  city: string;
  visualKeyword: string;
}

export interface ItineraryStructure {
  summary: string;
  highlights: { icon: string; title: string; desc: string }[];
  days: DayPlanSkeleton[];
}

export interface TripSkeleton extends VisualIdentity, ItineraryStructure {}

export interface LocationData {
  name: string;
  lat?: number;
  lng?: number;
  address?: string;
}

export interface Activity {
  title: string;
  description: string;
  time: string;
  location: LocationData;
  tips?: string;
  images?: string[];
  day?: number;
}

export interface DayPlan {
  day: number;
  title: string;
  theme: string;
  city: string;
  activities: Activity[];
}

export interface TripPlan {
  visualIdentity: VisualIdentity;
  summary: string;
  highlights: { icon: string; title: string; desc: string }[];
  days: DayPlan[];
}

// ==================== 新增类型定义 ====================

// 地图显示模式 (旧版 ViewMode 重命名以避免冲突)
export type ViewModeType = 'list' | 'map' | 'split';

export interface MapDisplayMode {
  current: ViewModeType;
}

// POI 数据结构
export interface POI {
  id: string;
  name: string;
  nameEn?: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  rating?: number;
  openingHours?: string;
  estimatedDuration?: number; // 分钟
  priceLevel?: number; // 1-5
  images: string[];
  tags: string[];
  city?: string;
}

// 预算配置
export type CurrencyType = 'CNY' | 'USD' | 'EUR' | 'JPY';

export interface SimpleBudgetBreakdown {
  accommodation: number;
  transportation: number;
  food: number;
  activities: number;
  shopping: number;
  other: number;
}

export interface BudgetConfig {
  total: number;
  currency: CurrencyType;
  breakdown: SimpleBudgetBreakdown;
  estimated?: number; // 预估总花费
}

// 预算类别（用于显示）
export type BudgetCategory = keyof SimpleBudgetBreakdown;

// 天气信息
export interface WeatherInfo {
  date: string; // YYYY-MM-DD
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  precipitation: number; // 降水概率 %
  humidity?: number;
  windSpeed?: number;
  clothingAdvice?: string; // 穿衣建议
}

// 用户偏好
export type TravelStyle = 'relaxed' | 'balanced' | 'intense';
export type BudgetLevel = 'economy' | 'comfort' | 'luxury';
export type CompanionType = 'solo' | 'couple' | 'family' | 'friends';

export interface UserPreferences {
  // 兴趣偏好
  interests: string[]; // ['文化', '美食', '自然', '购物', '夜生活']
  // 旅行风格
  travelStyle: TravelStyle;
  // 预算档次
  budgetLevel: BudgetLevel;
  // 住宿偏好
  accommodationTypes: string[];
  // 饮食要求
  dietaryRestrictions: string[];
  // 同伴类型
  companionType: CompanionType;
  // 特殊需求
  specialNeeds: string[];
}

// 扩展的行程计划（包含 POI、预算、天气等）
export interface EnhancedTripPlan extends VisualIdentity {
  id?: string; // 用于保存和分享
  createdAt?: string;
  updatedAt?: string;
  summary: string;
  highlights: { icon: string; title: string; desc: string }[];
  days: DayPlan[]; // 使用完整的 DayPlan 而不是 DayPlanSkeleton
  pois?: Record<number, POI[]>; // 按天索引的 POI 列表
  budget?: BudgetConfig;
  weather?: WeatherInfo[];
  preferences?: UserPreferences;
}

// 可编辑的活动
export interface EditableActivity extends Activity {
  id: string;
  poiId?: string;
  order: number;
  day: number;
  duration?: number; // 分钟
  cost?: number; // 花费
}

// 快捷操作类型
export type QuickActionType =
  | 'makeRelaxed'      // 让行程更轻松
  | 'makeIntense'      // 让行程更紧张
  | 'optimizeRoute'    // 优化路线
  | 'adjustBudget'     // 调整预算
  | 'changeArea';      // 更换住宿区域

// 地图标记数据
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  day: number;
  category: string;
  isSelected?: boolean;
}

// 地图视图状态
export interface MapViewState {
  center: { lat: number; lng: number };
  zoom: number;
  selectedDay: number | null;
  selectedMarker: string | null;
}

// 列表视图状态
export interface ListViewState {
  expandedDays: Set<number>;
  selectedActivity: string | null;
}

// 历史行程记录
export interface TripHistoryItem {
  id: string;
  name: string;
  destination: string;
  duration: number;
  createdAt: string;
  thumbnail?: string;
}

// 分享设置
export interface ShareSettings {
  allowEdit: boolean;
  allowCopy: boolean;
  expiresIn?: number; // 过期时间（天）
  password?: string;
}

// 聚类结果
export interface ClusterResult {
  center: { lat: number; lng: number };
  points: POI[];
  dayIndex: number;
}

// 时间验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 路线优化结果
export interface RouteOptimizationResult {
  originalOrder: string[];
  optimizedOrder: string[];
  timeSaved: number; // 分钟
  distanceReduced: number; // 公里
}

// ==================== 追问/后续输入类型 ====================

/**
 * 意图分类枚举（对应多种核心处理模式）
 */
export enum FollowUpIntent {
  REGENERATE_GLOBAL = 'REGENERATE_GLOBAL',   // 全局重构：需要重新生成整个行程
  UPDATE_LOCAL = 'UPDATE_LOCAL',             // 局部微调：仅修改某天/某部分
  QA_QUERY = 'QA_QUERY',                     // 咨询问答：不需要修改行程
  CHAT = 'CHAT',                            // 闲聊：礼貌回应、感谢、无关对话
  SEARCH = 'SEARCH'                         // 搜索查询：餐厅、景点、交通等POI查询
}

/**
 * UI 动作类型（前端根据此决定交互方式）
 */
export enum UIAction {
  STREAM_LOADING = 'stream_loading',   // 显示流式加载动画，进入生成模式
  SILENT_UPDATE = 'silent_update',     // 静默更新，保持当前界面
  CHAT_REPLY = 'chat_reply',           // 聊天回复弹窗
  DAY_CONFIRMATION = 'day_confirmation',     // 天数确认弹窗
  SEARCH_CONFIRMATION = 'search_confirmation' // 搜索结果确认展示
}

/**
 * 意图分析结果
 */
export interface FollowUpAnalysis {
  intent: FollowUpIntent;
  ui_action: UIAction;
  targetDay?: number;              // 目标天数（UPDATE_LOCAL 时有效）
  confidence: number;               // 置信度 0-1
  reasoning: string;                // 分析原因
  suggestedAction: string;          // 建议的操作描述
  extractedParams?: {               // 提取的参数
    newDestination?: string;
    newDuration?: number;
    modifiedActivities?: string[];
  };
}

// ==================== 报告聊天面板类型 ====================

/**
 * 聊天消息类型
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'day-confirmation' | 'search-result';
  timestamp: Date;
  metadata?: {
    suggestedDay?: number;
    searchResults?: SearchResult[];
    confirmationOptions?: string[];
  };
}

/**
 * 增强的意图分析结果
 */
export interface EnhancedFollowUpAnalysis extends FollowUpAnalysis {
  // 新增字段
  chatType?: 'casual' | 'clarification' | 'feedback';
  searchQuery?: string;
  searchCategory?: 'restaurant' | 'attraction' | 'transport' | 'accommodation';
  suggestedDay?: number;
  dayConfidence?: number; // 0-1, AI对天数识别的置信度
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
  confirmationOptions?: string[];
}

/**
 * 搜索结果类型
 */
export interface SearchResult {
  id: string;
  name: string;
  nameEn?: string;
  address: string;
  distance?: string;
  category: string;
  rating?: number;
  tel?: string;
  lat?: number;
  lng?: number;
}

// ==================== 场景感知系统类型 ====================

/**
 * 场景类型枚举
 */
export enum SceneType {
  ROMANTIC = 'romantic',      // 浪漫情侣
  FAMILY = 'family',          // 亲子家庭
  ADVENTURE = 'adventure',    // 户外探险
  BUSINESS = 'business',      // 商务出行
  FOODIE = 'foodie',          // 美食之旅
  CULTURE = 'culture',        // 文化深度
  RELAXATION = 'relaxation',  // 休闲度假
  SOLO = 'solo'               // 独行旅行
}

/**
 * 场景分析结果
 */
export interface SceneAnalysis {
  sceneType: SceneType;
  confidence: number;        // 0-1
  quickSummary: string;       // 一句话摘要
  recommendedTemplate: string; // 推荐模板名称
  keyHighlights: string[];    // 关键亮点
  detectedKeywords: string[]; // 检测到的关键词
}

/**
 * 场景模板配置
 */
export interface SceneTemplate {
  type: SceneType;
  name: string;
  description: string;
  promptHints: string[];      // AI生成的提示
  colorPalette: string;       // 推荐色系
  fontConfig: FontConfig;
  htmlTemplate: string;       // HTML模板
}

// ==================== 双视图系统类型 ====================

/**
 * 视图模式枚举
 */
export enum ViewMode {
  ORGANIZER = 'organizer',    // 组织者视图
  TRAVELER = 'traveler'       // 旅行者视图
}

/**
 * 准备物品项
 */
export interface PackingItem {
  category: string;          // 类别：衣物、电子、证件等
  item: string;              // 物品名称
  quantity?: string;         // 数量
  essential: boolean;        // 是否必需
  checked?: boolean;         // 是否已打包
}

/**
 * 预算详情
 */
export interface BudgetBreakdown {
  category: string;          // 类别
  amount: number;            // 金额
  currency: string;          // 货币
  items?: string[];          // 具体项目
}

/**
 * 紧急联系人
 */
export interface EmergencyContact {
  type: string;              // 类型：警察、医院、大使馆等
  name: string;
  phone: string;
  address?: string;
}

/**
 * 每日亮点（旅行者视图）
 */
export interface DayHighlight {
  day: number;
  title: string;
  highlight: string;         // 一句话亮点
  mustSee: string[];         // 必看景点
  mustDo: string[];          // 必做事项
}

/**
 * 必要信息（旅行者视图）
 */
export interface EssentialInfo {
  destination: string;
  duration: number;
  bestSeason: string;        // 最佳季节
  language: string;          // 语言
  currency: string;          // 货币
  timezone: string;          // 时区
  voltage: string;           // 电压
  emergencyNumber: string;   // 紧急电话
}

/**
 * 分享数据结构
 */
export interface ShareData {
  organizerView: {
    packingList: PackingItem[];
    budgetEstimate: BudgetBreakdown[];
    emergencyContacts: EmergencyContact[];
    notes: string;
    shareUrl?: string;
  };
  travelerView: {
    quickOverview: string;
    dailyHighlights: DayHighlight[];
    essentialInfo: EssentialInfo;
  };
  generatedAt: string;
}

// ==================== 版本管理系统类型 ====================

/**
 * 版本变更类型
 */
export interface VersionChange {
  type: 'global' | 'local';   // 全局修改或局部修改
  day?: number;               // 局部修改时的天数
  description: string;        // 变更描述
  timestamp: number;          // 变更时间戳
}

/**
 * 版本历史记录
 */
export interface VersionHistory {
  id: string;
  version: number;            // 版本号
  timestamp: number;
  author: string;             // 创建者
  changes: VersionChange[];
  skeleton: TripSkeleton;     // 完整的行程骨架
  summary: string;            // 版本摘要
}

/**
 * 反馈类型
 */
export enum FeedbackType {
  SUGGESTION = 'suggestion',  // 建议
  OBJECTION = 'objection',    // 异议
  QUESTION = 'question',      // 问题
  APPROVAL = 'approval'       // 认可
}

/**
 * 用户反馈
 */
export interface UserFeedback {
  id: string;
  type: FeedbackType;
  targetDay?: number;         // 关联的天数
  content: string;            // 反馈内容
  author: string;             // 反馈者
  timestamp: number;
  status: 'pending' | 'addressed' | 'rejected';
  resolvedChanges?: string[]; // 已解决的变更
}

/**
 * 协作会话
 */
export interface CollaborationSession {
  id: string;
  tripId: string;
  participants: string[];     // 参与者列表
  versions: VersionHistory[]; // 版本历史
  feedbacks: UserFeedback[];  // 反馈列表
  currentVersion: number;     // 当前版本号
  createdAt: number;
  updatedAt: number;
}

// ==================== 渐进式渲染类型 ====================

/**
 * 渲染阶段
 */
export enum RenderPhase {
  SKELETON = 'skeleton',       // 骨架屏
  HEADER = 'header',           // 头部信息
  OVERVIEW = 'overview',       // 概览
  DAY_1 = 'day_1',            // 第一天
  REMAINING = 'remaining',     // 剩余天数
  SHARE_VIEW = 'share_view',   // 分享视图
  COMPLETE = 'complete'        // 完成
}

/**
 * 渲染状态
 */
export interface RenderState {
  phase: RenderPhase;
  completedDays: number;
  totalDays: number;
  estimatedTimeRemaining: number;
}

/**
 * 骨架屏数据
 */
export interface SkeletonData {
  destination: string;
  duration: number;
  sceneType: SceneType;
  estimatedTime: number;
  vibe: string;
}
