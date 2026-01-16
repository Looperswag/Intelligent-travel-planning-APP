/**
 * SceneAgent - 场景适配规划Agent
 *
 * 功能：
 * 1. 基于场景类型生成适配的行程框架
 * 2. 应用场景特定的prompt提示
 * 3. 调整行程节奏和内容重点
 */

import { GLMClient, getGlmClient } from '../glmService';
import { SceneType, SceneAnalysis, TripSkeleton, VisualIdentity } from '../../types';
import { getSceneTemplate } from '../../templates/scenes';

/**
 * SceneAgent类
 */
export class SceneAgent {
  private glmClient: GLMClient;

  constructor(glmClient: GLMClient) {
    this.glmClient = glmClient;
  }

  /**
   * 基于场景分析生成适配的行程框架
   */
  async generateAdaptedSkeleton(
    sceneAnalysis: SceneAnalysis,
    prompt: string,
    linkText: string,
    visualIdentity: VisualIdentity
  ): Promise<TripSkeleton> {
    const template = getSceneTemplate(sceneAnalysis.sceneType);

    // 构建场景适配的prompt
    const adaptedPrompt = this.buildSceneAdaptedPrompt(
      prompt,
      sceneAnalysis,
      template,
      visualIdentity
    );

    // 调用原有的行程框架生成逻辑
    const skeleton = await this.generateItineraryStructure(
      adaptedPrompt,
      linkText,
      visualIdentity
    );

    // 应用场景特定的调整
    return this.applySceneAdjustments(skeleton, sceneAnalysis.sceneType);
  }

  /**
   * 构建场景适配的Prompt
   */
  private buildSceneAdaptedPrompt(
    originalPrompt: string,
    sceneAnalysis: SceneAnalysis,
    template: any,
    visualIdentity: VisualIdentity
  ): string {
    const hints = template.promptHints.join('、');

    return `你是一位专业的旅行规划师！请为用户规划行程。

用户需求：${originalPrompt}

场景类型：${sceneAnalysis.sceneType}
场景特点：${sceneAnalysis.quickSummary}
关键亮点：${sceneAnalysis.keyHighlights.join('、')}

请特别注意以下场景要求：
${hints}

请生成${visualIdentity.duration}天的行程框架，每天包含：
- title: 主题标题
- theme: 今天的主题/氛围
- city: 所在城市
- visualKeyword: 视觉关键词（用于配图）

请以JSON格式返回。`;
  }

  /**
   * 生成行程框架结构
   */
  private async generateItineraryStructure(
    prompt: string,
    linkText: string,
    visual: VisualIdentity
  ): Promise<any> {
    const response = await this.glmClient.generateContent({
      prompt: this.buildStructurePrompt(prompt, linkText, visual),
      maxTokens: 2000,
      temperature: 0.7,
      enableThinking: true
    });

    return this.parseStructureResponse(response.text, visual);
  }

  /**
   * 构建结构生成Prompt
   */
  private buildStructurePrompt(
    prompt: string,
    linkText: string,
    visual: VisualIdentity
  ): string {
    return `你是一位超有审美的旅行规划师！🌟✨

用户需求："${prompt}"
${linkText ? `参考链接：\n${linkText}` : ''}

请为 ${visual.destination} 的 ${visual.duration} 天旅程创建一个精彩的行程框架。

整体氛围：${visual.vibe}
色系风格：${visual.palette}

请生成JSON格式的行程框架：
{
  "summary": "整个旅程的一句话概括（要精彩！）",
  "highlights": [
    { "icon": "emoji", "title": "亮点名称", "desc": "简短描述" }
  ],
  "days": [
    {
      "day": 1,
      "title": "第一天标题",
      "theme": "今天的主题/风格",
      "city": "所在城市",
      "visualKeyword": "用于配图的关键词"
    }
  ]
}

要求：
1. summary要吸引人，体现${visual.vibe}的风格
2. highlights选4个最精彩的亮点
3. 每天的安排要合理，不要太赶也不要太松
4. visualKeyword要具体，方便找配图（如"京都寺庙"、"东京街道"）

不要输出JSON之外的任何内容。`;
  }

  /**
   * 解析结构响应
   */
  private parseStructureResponse(response: string, visual: VisualIdentity): any {
    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return {
        ...visual,
        ...parsed
      };
    } catch (error) {
      console.error('Failed to parse structure response:', error);
      // 返回默认结构
      return this.getDefaultStructure(visual);
    }
  }

  /**
   * 获取默认行程结构
   */
  private getDefaultStructure(visual: VisualIdentity): any {
    return {
      ...visual,
      summary: `探索${visual.destination}的精彩${visual.duration}天`,
      highlights: [
        { icon: '🌟', title: '精彩体验', desc: '丰富的文化活动' },
        { icon: '🍜', title: '地道美食', desc: '品尝当地特色' },
        { icon: '🏛️', title: '历史古迹', desc: '感受文化底蕴' },
        { icon: '🌸', title: '自然风光', desc: '享受美丽风景' }
      ],
      days: Array.from({ length: visual.duration }, (_, i) => ({
        day: i + 1,
        title: `第${i + 1}天：探索${visual.destination}`,
        theme: visual.vibe,
        city: visual.destination,
        visualKeyword: `${visual.destination} travel`
      }))
    };
  }

  /**
   * 应用场景特定的调整
   */
  private applySceneAdjustments(
    skeleton: TripSkeleton,
    sceneType: SceneType
  ): TripSkeleton {
    const template = getSceneTemplate(sceneType);

    // 应用场景色系
    skeleton.palette = template.colorPalette;
    skeleton.fontConfig = template.fontConfig;
    skeleton.sceneType = sceneType;

    // 根据场景类型调整行程特点
    switch (sceneType) {
      case SceneType.ROMANTIC:
        // 浪漫行程：减少景点数量，增加停留时间
        skeleton.days = skeleton.days.map(day => ({
          ...day,
          theme: day.theme.includes('浪漫') ? day.theme : `浪漫${day.theme}`
        }));
        break;

      case SceneType.FAMILY:
        // 亲子行程：添加安全提示
        skeleton.summary += '（适合全家老少，节奏轻松）';
        break;

      case SceneType.ADVENTURE:
        // 探险行程：增加活动强度提示
        break;

      case SceneType.BUSINESS:
        // 商务行程：保持高效
        break;

      case SceneType.FOODIE:
        // 美食行程：强调美食体验
        skeleton.highlights.push({
          icon: '🍜',
          title: '美食探索',
          desc: '品尝地道特色美食'
        });
        break;

      case SceneType.CULTURE:
        // 文化行程：增加文化深度
        break;

      case SceneType.RELAXATION:
        // 休闲行程：强调放松
        skeleton.summary += '（悠闲度假，放松身心）';
        break;

      case SceneType.SOLO:
        // 独行行程：强调自由和安全
        break;
    }

    return skeleton;
  }
}

/**
 * 创建SceneAgent实例的工厂函数
 */
export function createSceneAgent(glmClient?: GLMClient | null): SceneAgent {
  if (!glmClient) {
    try {
      glmClient = getGlmClient();
    } catch (error) {
      console.warn('GLM client not available:', error);
      return new SceneAgent(getGlmClient() as GLMClient);
    }
  }
  return new SceneAgent(glmClient as GLMClient);
}
