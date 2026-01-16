/**
 * ShareAgent - 分享视图生成Agent
 *
 * 功能：
 * 1. 生成组织者视图（准备清单、预算、紧急联系人）
 * 2. 生成旅行者视图（快速概览、亮点、必要信息）
 * 3. 为不同角色提供最优信息展示
 */

import { GLMClient, getGlmClient } from '../glmService';
import { TripSkeleton, ShareData } from '../../types';

/**
 * ShareAgent类
 */
export class ShareAgent {
  private glmClient: GLMClient;

  constructor(glmClient: GLMClient) {
    this.glmClient = glmClient;
  }

  /**
   * 生成完整的分享数据（组织者视图 + 旅行者视图）
   */
  async generateShareData(skeleton: TripSkeleton): Promise<ShareData> {
    const [organizerView, travelerView] = await Promise.all([
      this.generateOrganizerView(skeleton),
      this.generateTravelerView(skeleton)
    ]);

    return {
      organizerView,
      travelerView,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 生成组织者视图
   */
  async generateOrganizerView(skeleton: TripSkeleton): Promise<ShareData['organizerView']> {
    const prompt = this.buildOrganizerPrompt(skeleton);

    const response = await this.glmClient.generateContent({
      prompt,
      maxTokens: 1500,
      temperature: 0.5,
      enableThinking: true
    });

    return this.parseOrganizerResponse(response.text, skeleton);
  }

  /**
   * 构建组织者视图Prompt
   */
  private buildOrganizerPrompt(skeleton: TripSkeleton): string {
    return `你是一位细心的旅行顾问！请为以下行程生成组织者需要的准备信息。

目的地：${skeleton.destination}
天数：${skeleton.duration}天
风格：${skeleton.vibe}

请生成JSON格式：
{
  "packingList": [
    { "category": "衣物", "item": "具体物品", "quantity": "数量", "essential": true },
    { "category": "电子", "item": "具体物品", "essential": false }
  ],
  "budgetEstimate": [
    { "category": "交通", "amount": 金额, "currency": "CNY", "items": ["具体项目"] },
    { "category": "住宿", "amount": 金额, "currency": "CNY" }
  ],
  "emergencyContacts": [
    { "type": "警察", "name": "报警电话", "phone": "当地号码" },
    { "type": "医院", "name": "急救电话", "phone": "当地号码" }
  ],
  "notes": "给组织者的其他重要提醒"
}

要求：
1. packingList包含必要的衣物、电子、证件、药品等
2. budgetEstimate估算各项目花费（人民币）
3. emergencyContacts包含当地的紧急联系方式
4. notes提供实用建议

只返回JSON，不要其他内容。`;
  }

  /**
   * 解析组织者视图响应
   */
  private parseOrganizerResponse(response: string, skeleton: TripSkeleton): ShareData['organizerView'] {
    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to parse organizer response:', error);
    }

    // 返回默认数据
    return this.getDefaultOrganizerView(skeleton);
  }

  /**
   * 获取默认组织者视图
   */
  private getDefaultOrganizerView(skeleton: TripSkeleton): ShareData['organizerView'] {
    return {
      packingList: [
        { category: '衣物', item: '舒适步行鞋', quantity: '1-2双', essential: true },
        { category: '衣物', item: '换洗衣物', quantity: `${skeleton.duration}套`, essential: true },
        { category: '证件', item: '身份证/护照', quantity: '1份', essential: true },
        { category: '电子', item: '手机充电器', quantity: '1个', essential: true },
        { category: '电子', item: '相机', quantity: '1台', essential: false },
        { category: '药品', item: '常用药品', quantity: '1套', essential: true }
      ],
      budgetEstimate: [
        { category: '交通', amount: skeleton.duration * 500, currency: 'CNY', items: ['往返交通', '当地交通'] },
        { category: '住宿', amount: skeleton.duration * 400, currency: 'CNY', items: ['酒店住宿'] },
        { category: '餐饮', amount: skeleton.duration * 200, currency: 'CNY', items: ['一日三餐'] },
        { category: '景点', amount: skeleton.duration * 150, currency: 'CNY', items: ['门票', '活动'] },
        { category: '其他', amount: 500, currency: 'CNY', items: ['购物', '应急'] }
      ],
      emergencyContacts: [
        { type: '警察', name: '报警电话', phone: '110' },
        { type: '医院', name: '急救电话', phone: '120' },
        { type: '旅游', name: '旅游咨询', phone: '12301' }
      ],
      notes: `建议提前${Math.max(7, skeleton.duration * 2)}天开始准备行程，确认所有预订。`
    };
  }

  /**
   * 生成旅行者视图
   */
  async generateTravelerView(skeleton: TripSkeleton): Promise<ShareData['travelerView']> {
    const prompt = this.buildTravelerPrompt(skeleton);

    const response = await this.glmClient.generateContent({
      prompt,
      maxTokens: 1000,
      temperature: 0.5,
      enableThinking: true
    });

    return this.parseTravelerResponse(response.text, skeleton);
  }

  /**
   * 构建旅行者视图Prompt
   */
  private buildTravelerPrompt(skeleton: TripSkeleton): string {
    return `你是一位热情的旅行向导！请为以下行程生成旅行者最关心的信息。

目的地：${skeleton.destination}
天数：${skeleton.duration}天
风格：${skeleton.vibe}
行程概览：${skeleton.summary}

请生成JSON格式：
{
  "quickOverview": "一句话精华概括",
  "dailyHighlights": [
    { "day": 1, "title": "第一天标题", "highlight": "精华亮点", "mustSee": ["必看景点"], "mustDo": ["必做事项"] }
  ],
  "essentialInfo": {
    "destination": "目的地",
    "duration": 天数,
    "bestSeason": "最佳季节",
    "language": "语言",
    "currency": "货币",
    "timezone": "时区",
    "voltage": "电压",
    "emergencyNumber": "紧急电话"
  }
}

要求：
1. quickOverview要简洁有力，吸引人
2. dailyHighlights突出每天的精华
3. essentialInfo包含实用的必要信息

只返回JSON，不要其他内容。`;
  }

  /**
   * 解析旅行者视图响应
   */
  private parseTravelerResponse(response: string, skeleton: TripSkeleton): ShareData['travelerView'] {
    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to parse traveler response:', error);
    }

    // 返回默认数据
    return this.getDefaultTravelerView(skeleton);
  }

  /**
   * 获取默认旅行者视图
   */
  private getDefaultTravelerView(skeleton: TripSkeleton): ShareData['travelerView'] {
    return {
      quickOverview: `用${skeleton.duration}天时间深度体验${skeleton.destination}的${skeleton.vibe}`,
      dailyHighlights: skeleton.days.map(day => ({
        day: day.day,
        title: day.title,
        highlight: day.theme,
        mustSee: [`${day.city}特色景点`],
        mustDo: ['品尝当地美食', '拍照打卡']
      })),
      essentialInfo: {
        destination: skeleton.destination,
        duration: skeleton.duration,
        bestSeason: '全年皆宜',
        language: '当地语言',
        currency: '当地货币',
        timezone: '当地时间',
        voltage: '220V',
        emergencyNumber: '当地紧急电话'
      }
    };
  }
}

/**
 * 创建ShareAgent实例的工厂函数
 */
export function createShareAgent(glmClient?: GLMClient | null): ShareAgent {
  if (!glmClient) {
    try {
      glmClient = getGlmClient();
    } catch (error) {
      console.warn('GLM client not available:', error);
      return new ShareAgent(getGlmClient() as GLMClient);
    }
  }
  return new ShareAgent(glmClient as GLMClient);
}
