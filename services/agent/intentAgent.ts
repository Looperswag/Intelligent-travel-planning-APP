/**
 * IntentAgent - 场景识别和快速分析Agent
 *
 * 功能：
 * 1. 快速识别用户输入的旅行场景类型
 * 2. 提取关键信息（目的地、天数、偏好）
 * 3. 生成快速摘要
 * 4. 推荐合适的模板
 *
 * 性能目标：响应时间 < 0.5s
 */

import { GLMClient, getGlmClient } from '../glmService';
import { SceneType, SceneAnalysis, SkeletonData } from '../../types';

/**
 * 场景关键词映射表
 * 用于快速预判场景类型
 */
const SCENE_KEYWORDS: Record<SceneType, string[]> = {
  [SceneType.ROMANTIC]: [
    '情侣', '蜜月', '纪念日', '求婚', '浪漫', '二人世界', '情人节',
    'honeymoon', 'anniversary', 'romantic', 'couple', 'proposal'
  ],
  [SceneType.FAMILY]: [
    '亲子', '家庭', '小孩', '孩子', '儿童', '带娃', '全家', '老人',
    'family', 'kids', 'children', 'parents', 'baby', 'toddler'
  ],
  [SceneType.ADVENTURE]: [
    '探险', '徒步', '登山', '露营', '户外', '极限', '越野', '攀岩',
    'adventure', 'hiking', 'climbing', 'camping', 'outdoor', 'extreme'
  ],
  [SceneType.BUSINESS]: [
    '商务', '出差', '会议', '考察', '团建', '客户', '展览',
    'business', 'work', 'meeting', 'conference', 'corporate'
  ],
  [SceneType.FOODIE]: [
    '美食', '吃货', '餐厅', '小吃', '美食之旅', '品鉴', '料理',
    'food', 'foodie', 'cuisine', 'culinary', 'restaurant', 'gastronomy'
  ],
  [SceneType.CULTURE]: [
    '文化', '历史', '博物馆', '古迹', '艺术', '建筑', '人文',
    'culture', 'history', 'museum', 'heritage', 'art', 'architecture'
  ],
  [SceneType.RELAXATION]: [
    '度假', '休闲', '放松', '海滩', '海岛', '温泉', '度假村', '疗养',
    'relax', 'vacation', 'beach', 'resort', 'spa', 'island', 'leisure'
  ],
  [SceneType.SOLO]: [
    '独行', '独自', '一个人', 'solo', '独自旅行', '穷游', '背包客',
    'solo', 'alone', 'backpack', 'independent'
  ]
};

/**
 * IntentAgent 类
 */
export class IntentAgent {
  private glmClient: GLMClient | null;
  private cache: Map<string, SceneAnalysis>;

  constructor(glmClient?: GLMClient | null) {
    this.glmClient = glmClient || null;
    this.cache = new Map();
  }

  /**
   * 快速预判场景类型（基于关键词）
   * 响应时间：~10ms
   */
  quickPredict(input: string): SceneType {
    const lowerInput = input.toLowerCase();

    // 统计各场景的匹配度
    const scores: Record<SceneType, number> = {
      [SceneType.ROMANTIC]: 0,
      [SceneType.FAMILY]: 0,
      [SceneType.ADVENTURE]: 0,
      [SceneType.BUSINESS]: 0,
      [SceneType.FOODIE]: 0,
      [SceneType.CULTURE]: 0,
      [SceneType.RELAXATION]: 0,
      [SceneType.SOLO]: 0
    };

    // 计算关键词匹配分数
    for (const [scene, keywords] of Object.entries(SCENE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerInput.includes(keyword.toLowerCase())) {
          scores[scene as SceneType]++;
        }
      }
    }

    // 返回得分最高的场景
    let maxScore = 0;
    let predictedScene = SceneType.RELAXATION; // 默认值

    for (const [scene, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        predictedScene = scene as SceneType;
      }
    }

    return predictedScene;
  }

  /**
   * 深度场景分析（使用AI）
   * 响应时间：< 0.5s
   */
  async analyzeScene(input: string, mediaContext?: string): Promise<SceneAnalysis> {
    // 检查缓存
    const cacheKey = `${input}-${mediaContext || ''}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 快速预判作为baseline
    const predictedScene = this.quickPredict(input);

    // 如果没有GLM客户端，直接返回快速预判结果
    if (!this.glmClient) {
      return this.getFallbackAnalysis(input, predictedScene);
    }

    // 构建AI分析Prompt
    const prompt = this.buildAnalysisPrompt(input, mediaContext, predictedScene);

    try {
      const response = await this.glmClient.generateContent({
        prompt,
        maxTokens: 500,
        temperature: 0.3, // 降低温度以获得更一致的结果
        enableThinking: false // 关闭思考模式以加快速度
      });

      // 解析AI响应
      const analysis = this.parseAnalysisResponse(response.text, predictedScene);

      // 缓存结果
      this.cache.set(cacheKey, analysis);

      return analysis;
    } catch (error) {
      console.error('IntentAgent analysis failed:', error);
      // 降级到快速预判结果
      return this.getFallbackAnalysis(input, predictedScene);
    }
  }

  /**
   * 构建场景分析Prompt
   */
  private buildAnalysisPrompt(input: string, mediaContext: string | undefined, predictedScene: SceneType): string {
    return `你是一位旅行场景分析专家。请分析用户的旅行需求，快速识别场景类型。

用户需求：${input}

${mediaContext ? `媒体参考：\n${mediaContext}\n` : ''}

初步判断场景：${predictedScene}

请以JSON格式返回分析结果：
{
  "sceneType": "场景类型（romantic/family/adventure/business/foodie/culture/relaxation/solo）",
  "confidence": 0.0-1.0的置信度,
  "quickSummary": "一句话描述这次旅行的核心",
  "keyHighlights": ["亮点1", "亮点2", "亮点3"],
  "detectedKeywords": ["检测到的关键词1", "关键词2"]
}

要求：
1. sceneType必须准确反映用户意图
2. confidence应基于用户输入的明确程度
3. quickSummary要简洁有力，体现旅行特色
4. keyHighlights提炼3-5个核心亮点
5. 不要输出任何JSON之外的文字`;
  }

  /**
   * 解析AI响应
   */
  private parseAnalysisResponse(response: string, fallbackScene: SceneType): SceneAnalysis {
    try {
      // 提取JSON（处理可能的markdown代码块）
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        sceneType: parsed.sceneType || fallbackScene,
        confidence: parsed.confidence || 0.7,
        quickSummary: parsed.quickSummary || '精彩旅程等你来探索',
        recommendedTemplate: this.getTemplateName(parsed.sceneType || fallbackScene),
        keyHighlights: parsed.keyHighlights || [],
        detectedKeywords: parsed.detectedKeywords || []
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      return this.getFallbackAnalysis('', fallbackScene);
    }
  }

  /**
   * 获取降级分析结果
   */
  private getFallbackAnalysis(_input: string, sceneType: SceneType): SceneAnalysis {
    return {
      sceneType,
      confidence: 0.6,
      quickSummary: this.getDefaultSummary(sceneType),
      recommendedTemplate: this.getTemplateName(sceneType),
      keyHighlights: this.getDefaultHighlights(sceneType),
      detectedKeywords: []
    };
  }

  /**
   * 获取场景默认摘要
   */
  private getDefaultSummary(sceneType: SceneType): string {
    const summaries: Record<SceneType, string> = {
      [SceneType.ROMANTIC]: '浪漫之旅，与爱人共度美好时光',
      [SceneType.FAMILY]: '温馨家庭游，创造美好回忆',
      [SceneType.ADVENTURE]: '勇敢探险，挑战自我极限',
      [SceneType.BUSINESS]: '高效商务出行，工作与体验兼顾',
      [SceneType.FOODIE]: '舌尖上的旅程，品味地道美食',
      [SceneType.CULTURE]: '深度文化之旅，感受历史底蕴',
      [SceneType.RELAXATION]: '放松身心，享受悠闲时光',
      [SceneType.SOLO]: '独自出发，遇见未知的自己'
    };
    return summaries[sceneType];
  }

  /**
   * 获取场景默认亮点
   */
  private getDefaultHighlights(sceneType: SceneType): string[] {
    const highlights: Record<SceneType, string[]> = {
      [SceneType.ROMANTIC]: ['浪漫餐厅', '日落观景', '双人活动'],
      [SceneType.FAMILY]: ['亲子友好', '老少皆宜', '轻松舒适'],
      [SceneType.ADVENTURE]: ['刺激体验', '自然风光', '挑战自我'],
      [SceneType.BUSINESS]: ['高效行程', '交通便利', '品质住宿'],
      [SceneType.FOODIE]: ['地道美食', '特色餐厅', '美食探索'],
      [SceneType.CULTURE]: ['历史古迹', '文化体验', '艺术熏陶'],
      [SceneType.RELAXATION]: ['悠闲节奏', '舒适环境', '放松体验'],
      [SceneType.SOLO]: ['自由探索', '深度体验', '独立冒险']
    };
    return highlights[sceneType];
  }

  /**
   * 获取模板名称
   */
  private getTemplateName(sceneType: SceneType): string {
    return `${sceneType}_template`;
  }

  /**
   * 生成骨架屏数据
   */
  generateSkeletonData(
    input: string,
    analysis: SceneAnalysis,
    duration?: number
  ): SkeletonData {
    // 提取目的地（简单正则匹配）
    const destinationMatch = input.match(/去|到|在|前往\s*([^\s,，。.]+)(?:\s|,|，|。|\.|$)/);
    const destination = destinationMatch?.[1] || '精彩目的地';

    return {
      destination,
      duration: duration || this.extractDuration(input),
      sceneType: analysis.sceneType,
      estimatedTime: this.estimateTime(analysis.sceneType),
      vibe: analysis.quickSummary
    };
  }

  /**
   * 提取旅行天数
   */
  private extractDuration(input: string): number {
    // 匹配"X天"、"X日"等模式
    const dayMatch = input.match(/(\d+)\s*[天日]/);
    if (dayMatch) {
      return parseInt(dayMatch[1]);
    }
    return 5; // 默认5天
  }

  /**
   * 估算生成时间（秒）
   */
  private estimateTime(sceneType: SceneType): number {
    // 不同场景的复杂度不同，所需时间也不同
    const baseTime = 20; // 基础时间20秒
    const multipliers: Record<SceneType, number> = {
      [SceneType.ROMANTIC]: 1.2,
      [SceneType.FAMILY]: 1.3,
      [SceneType.ADVENTURE]: 1.5,
      [SceneType.BUSINESS]: 0.8,
      [SceneType.FOODIE]: 1.1,
      [SceneType.CULTURE]: 1.4,
      [SceneType.RELAXATION]: 0.9,
      [SceneType.SOLO]: 1.0
    };
    return Math.floor(baseTime * multipliers[sceneType]);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * 创建IntentAgent实例的工厂函数
 */
export function createIntentAgent(glmClient?: GLMClient | null): IntentAgent {
  if (!glmClient) {
    try {
      // 如果没有提供GLMClient，尝试创建
      glmClient = getGlmClient();
    } catch (error) {
      // 如果创建失败（例如没有API密钥），返回不带GLM客户端的实例
      console.warn('GLM client not available, IntentAgent will work in limited mode:', error);
      return new IntentAgent(null);
    }
  }
  return new IntentAgent(glmClient);
}
