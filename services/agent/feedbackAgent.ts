/**
 * FeedbackAgent - 反馈处理Agent
 *
 * 功能：
 * 1. 处理用户对行程的异议和建议
 * 2. 分析反馈类型（建议、异议、问题、认可）
 * 3. 生成修改方案
 * 4. 管理版本历史
 */

import { GLMClient, getGlmClient } from '../glmService';
import { TripSkeleton, UserFeedback, FeedbackType, VersionChange, VersionHistory } from '../../types';

/**
 * 反馈分析结果
 */
export interface FeedbackAnalysis {
  feedbackType: FeedbackType;
  severity: 'low' | 'medium' | 'high';
  targetDays: number[];
  suggestedChanges: VersionChange[];
  requiresGlobalRegeneration: boolean;
  estimatedImpact: string;
}

/**
 * FeedbackAgent类
 */
export class FeedbackAgent {
  private glmClient: GLMClient;

  constructor(glmClient: GLMClient) {
    this.glmClient = glmClient;
  }

  /**
   * 分析用户反馈
   */
  async analyzeFeedback(
    feedback: string,
    targetDay: number | null,
    currentSkeleton: TripSkeleton
  ): Promise<FeedbackAnalysis> {
    const prompt = this.buildAnalysisPrompt(feedback, targetDay, currentSkeleton);

    const response = await this.glmClient.generateContent({
      prompt,
      maxTokens: 1000,
      temperature: 0.5,
      enableThinking: true
    });

    return this.parseAnalysisResponse(response.text, targetDay);
  }

  /**
   * 构建反馈分析Prompt
   */
  private buildAnalysisPrompt(
    feedback: string,
    targetDay: number | null,
    skeleton: TripSkeleton
  ): string {
    const tripInfo = `
目的地：${skeleton.destination}
天数：${skeleton.duration}天
风格：${skeleton.vibe}

每日行程：
${skeleton.days.map(d => `Day ${d.day}: ${d.title} (${d.theme})`).join('\n')}
    `.trim();

    return `你是一位智能行程顾问！请分析用户对旅行计划的反馈。

【当前行程】
${tripInfo}

【用户反馈】
反馈内容：${feedback}
${targetDay ? `针对天数：Day ${targetDay}` : '针对整体行程'}

请分析并返回JSON格式：
{
  "feedbackType": "suggestion|objection|question|approval",
  "severity": "low|medium|high",
  "targetDays": [受影响的天数],
  "suggestedChanges": [
    {
      "type": "global|local",
      "day": 天数（仅local时）,
      "description": "具体修改描述",
      "timestamp": 当前时间戳
    }
  ],
  "requiresGlobalRegeneration": true/false,
  "estimatedImpact": "对行程的影响描述"
}

反馈类型说明：
- suggestion: 改进建议
- objection: 异议（不同意当前安排）
- question: 咨询问答
- approval: 认可满意

只返回JSON，不要其他内容。`;
  }

  /**
   * 解析分析响应
   */
  private parseAnalysisResponse(response: string, targetDay: number | null): FeedbackAnalysis {
    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

        // 确保时间戳存在
        parsed.suggestedChanges = parsed.suggestedChanges.map((change: any) => ({
          ...change,
          timestamp: change.timestamp || Date.now()
        }));

        return parsed;
      }
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
    }

    // 返回默认分析
    return this.getDefaultAnalysis(targetDay);
  }

  /**
   * 获取默认分析
   */
  private getDefaultAnalysis(targetDay: number | null): FeedbackAnalysis {
    if (targetDay) {
      return {
        feedbackType: FeedbackType.SUGGESTION,
        severity: 'medium',
        targetDays: [targetDay],
        suggestedChanges: [{
          type: 'local',
          day: targetDay,
          description: '根据用户反馈调整行程',
          timestamp: Date.now()
        }],
        requiresGlobalRegeneration: false,
        estimatedImpact: '影响单日行程'
      };
    }

    return {
      feedbackType: FeedbackType.SUGGESTION,
      severity: 'medium',
      targetDays: [],
      suggestedChanges: [{
        type: 'global',
        description: '根据用户反馈调整整体行程',
        timestamp: Date.now()
      }],
      requiresGlobalRegeneration: true,
      estimatedImpact: '影响整体行程'
    };
  }

  /**
   * 创建版本历史记录
   */
  createVersionHistory(
    skeleton: TripSkeleton,
    changes: VersionChange[],
    author: string,
    previousVersion?: VersionHistory
  ): VersionHistory {
    const version = previousVersion ? previousVersion.version + 1 : 1;

    return {
      id: `v${version}_${Date.now()}`,
      version,
      timestamp: Date.now(),
      author,
      changes,
      skeleton,
      summary: this.generateVersionSummary(changes)
    };
  }

  /**
   * 生成版本摘要
   */
  private generateVersionSummary(changes: VersionChange[]): string {
    const globalChanges = changes.filter(c => c.type === 'global').length;
    const localChanges = changes.filter(c => c.type === 'local').length;

    const parts = [];
    if (globalChanges > 0) parts.push(`${globalChanges}项全局修改`);
    if (localChanges > 0) parts.push(`${localChanges}天调整`);

    return parts.join('，') || '行程更新';
  }

  /**
   * 生成修改建议的响应
   */
  async generateModificationResponse(
    feedback: string,
    analysis: FeedbackAnalysis,
    skeleton: TripSkeleton
  ): Promise<string> {
    const prompt = this.buildResponsePrompt(feedback, analysis, skeleton);

    const response = await this.glmClient.generateContent({
      prompt,
      maxTokens: 500,
      temperature: 0.7,
      enableThinking: false
    });

    return response.text;
  }

  /**
   * 构建响应Prompt
   */
  private buildResponsePrompt(
    feedback: string,
    analysis: FeedbackAnalysis,
    _skeleton: TripSkeleton
  ): string {
    return `你是旅行规划助手！用户对行程提出了反馈，请给出友好、专业的回应。

【用户反馈】
${feedback}

【分析结果】
类型：${analysis.feedbackType}
影响：${analysis.estimatedImpact}

请生成一段友好的回应（50字以内）：
1. 表达理解和感谢
2. 说明将如何处理
3. 保持积极语气

直接输出回应文本，不要JSON或其他格式。`;
  }

  /**
   * 对比两个版本的差异
   */
  compareVersions(version1: VersionHistory, version2: VersionHistory): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    const changes1 = version1.changes;
    const changes2 = version2.changes;

    // 简化版差异对比
    return {
      added: changes2.filter(c2 => !changes1.some(c1 => c1.day === c2.day && c1.type === c2.type)).map(c => c.description),
      removed: changes1.filter(c1 => !changes2.some(c2 => c2.day === c1.day && c2.type === c1.type)).map(c => c.description),
      modified: [] // 需要更复杂的对比逻辑
    };
  }

  /**
   * 合并反馈到行程
   */
  async mergeFeedback(
    skeleton: TripSkeleton,
    feedback: UserFeedback
  ): Promise<TripSkeleton> {
    // 根据反馈类型处理
    if (feedback.type === FeedbackType.OBJECTION && feedback.targetDay) {
      // 异议处理：需要重新生成该天
      return this.regenerateDay(skeleton, feedback.targetDay, feedback.content);
    } else if (feedback.type === FeedbackType.SUGGESTION) {
      // 建议：可以作为参考，不一定修改
      return skeleton;
    } else {
      return skeleton;
    }
  }

  /**
   * 重新生成单天行程
   */
  private async regenerateDay(
    skeleton: TripSkeleton,
    day: number,
    feedback: string
  ): Promise<TripSkeleton> {
    const prompt = `
用户对Day ${day}提出反馈：${feedback}

请重新生成这一天的行程，保持：
- 城市：${skeleton.days[day - 1]?.city}
- 整体风格：${skeleton.vibe}

返回新的Day ${day}配置JSON：
{
  "title": "新标题",
  "theme": "新主题",
  "city": "城市",
  "visualKeyword": "关键词"
}
    `.trim();

    const response = await this.glmClient.generateContent({
      prompt,
      maxTokens: 500,
      temperature: 0.8,
      enableThinking: true
    });

    try {
      const newDay = JSON.parse(response.text);
      const newDays = [...skeleton.days];
      newDays[day - 1] = { ...skeleton.days[day - 1], ...newDay };

      return { ...skeleton, days: newDays };
    } catch (error) {
      console.error('Failed to regenerate day:', error);
      return skeleton;
    }
  }
}

/**
 * 创建FeedbackAgent实例的工厂函数
 */
export function createFeedbackAgent(glmClient?: GLMClient | null): FeedbackAgent {
  if (!glmClient) {
    try {
      glmClient = getGlmClient();
    } catch (error) {
      console.warn('GLM client not available:', error);
      return new FeedbackAgent(getGlmClient() as GLMClient);
    }
  }
  return new FeedbackAgent(glmClient as GLMClient);
}
