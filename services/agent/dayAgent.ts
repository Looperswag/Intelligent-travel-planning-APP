/**
 * DayAgent - 并行Day生成Worker
 *
 * 功能：
 * 1. 独立生成单天的详细行程
 * 2. 获取POI数据（坐标、地址）
 * 3. 生成对应的HTML内容
 * 4. 支持并行执行
 *
 * 性能目标：每天生成时间 < 5s
 */

import { GLMClient, getGlmClient } from '../glmService';
import { DayPlanSkeleton, TripSkeleton, DayPlan, Activity } from '../../types';
import * as AmapService from '../amapService';
import * as ImageService from '../imageService';

/**
 * Day生成结果
 */
export interface DayGenerationResult {
  dayNumber: number;
  skeleton: DayPlanSkeleton;
  dayPlan: DayPlan;
  html: string;
  generatedAt: number;
}

/**
 * DayAgent类
 * 负责生成单天的行程内容
 */
export class DayAgent {
  private glmClient: GLMClient;
  private daySkeleton: DayPlanSkeleton;
  private tripSkeleton: TripSkeleton;

  constructor(
    daySkeleton: DayPlanSkeleton,
    tripSkeleton: TripSkeleton,
    glmClient?: GLMClient
  ) {
    this.daySkeleton = daySkeleton;
    this.tripSkeleton = tripSkeleton;
    this.glmClient = glmClient || this.createGLMClient();
  }

  /**
   * 生成单天的完整内容
   */
  async generate(): Promise<DayGenerationResult> {
    const startTime = Date.now();

    try {
      // 1. 生成活动列表
      const activities = await this.generateActivities();

      // 2. 获取POI数据（并行）
      const enrichedActivities = await this.enrichWithPOI(activities);

      // 3. 获取图片（并行）
      const images = await this.fetchDayImages();

      // 4. 构建DayPlan
      const dayPlan: DayPlan = {
        day: this.daySkeleton.day,
        title: this.daySkeleton.title,
        theme: this.daySkeleton.theme,
        city: this.daySkeleton.city,
        activities: enrichedActivities
      };

      // 5. 生成HTML
      const html = await this.generateHTML(dayPlan, images);

      return {
        dayNumber: this.daySkeleton.day,
        skeleton: this.daySkeleton,
        dayPlan,
        html,
        generatedAt: Date.now() - startTime
      };
    } catch (error) {
      console.error(`DayAgent failed for day ${this.daySkeleton.day}:`, error);
      throw error;
    }
  }

  /**
   * 生成活动列表
   */
  private async generateActivities(): Promise<Activity[]> {
    const prompt = this.buildActivityPrompt();

    const response = await this.glmClient.generateContent({
      prompt,
      maxTokens: 1500,
      temperature: 0.7,
      enableThinking: true
    });

    return this.parseActivities(response.text);
  }

  /**
   * 构建活动生成Prompt
   */
  private buildActivityPrompt(): string {
    return `你是一位专业的旅行规划师！请为第${this.daySkeleton.day}天生成详细的活动安排。

目的地：${this.tripSkeleton.destination}
城市：${this.daySkeleton.city}
主题：${this.daySkeleton.theme}
视觉风格：${this.tripSkeleton.vibe}

请按照时间顺序生成3-5个活动，每个活动包含：
- time: 时间（如"09:00"）
- title: 活动标题
- description: 简短描述（50字以内）
- location: 地点名称

要求：
1. 时间安排要合理，考虑交通和用餐时间
2. 活动要贴合主题"${this.daySkeleton.theme}"
3. 结合风格"${this.tripSkeleton.vibe}"的氛围
4. 每个活动都应该是真实的景点或地点

请以JSON数组格式返回：
[
  {
    "time": "09:00",
    "title": "活动名称",
    "description": "简短描述",
    "location": "地点名称"
  }
]

不要输出任何JSON之外的内容。`;
  }

  /**
   * 解析活动列表
   */
  private parseActivities(response: string): Activity[] {
    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const activities = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return activities.map((act: any) => ({
        time: act.time || '09:00',
        title: act.title || '活动',
        description: act.description || '',
        location: { name: act.location || '' }
      }));
    } catch (error) {
      console.error('Failed to parse activities:', error);
      // 返回默认活动
      return this.getDefaultActivities();
    }
  }

  /**
   * 获取默认活动（降级方案）
   */
  private getDefaultActivities(): Activity[] {
    return [
      {
        time: '09:00',
        title: `探索${this.daySkeleton.city}`,
        description: '开始一天的精彩旅程',
        location: { name: this.daySkeleton.city }
      },
      {
        time: '12:00',
        title: '午餐时间',
        description: '品尝当地特色美食',
        location: { name: '当地餐厅' }
      },
      {
        time: '14:00',
        title: '文化体验',
        description: '深入了解当地文化',
        location: { name: '文化景点' }
      },
      {
        time: '18:00',
        title: '晚餐与休闲',
        description: '享受轻松的晚餐时光',
        location: { name: '美食街区' }
      }
    ];
  }

  /**
   * 用POI数据丰富活动信息
   */
  private async enrichWithPOI(activities: Activity[]): Promise<Activity[]> {
    // 并行获取所有活动的POI信息
    const enrichedPromises = activities.map(async (activity) => {
      if (activity.location?.name) {
        try {
          const poi = await AmapService.AmapService.searchPlace(
            activity.location.name,
            this.daySkeleton.city
          );

          if (poi) {
            return {
              ...activity,
              location: {
                ...activity.location,
                name: poi.name,
                lat: poi.lat,
                lng: poi.lng,
                address: poi.address || `${poi.city}`
              }
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch POI for ${activity.location.name}:`, error);
        }
      }
      return activity;
    });

    return Promise.all(enrichedPromises);
  }

  /**
   * 获取当天的图片
   */
  private async fetchDayImages(): Promise<string[]> {
    try {
      const images = await ImageService.ImageService.fetchImages({
        keyword: this.daySkeleton.visualKeyword,
        count: 3,
        orientation: 'landscape'
      });
      return images;
    } catch (error) {
      console.warn(`Failed to fetch images for day ${this.daySkeleton.day}:`, error);
      return [];
    }
  }

  /**
   * 生成HTML内容
   */
  private async generateHTML(dayPlan: DayPlan, images: string[]): Promise<string> {
    const { palette } = this.tripSkeleton;

    // 生成活动列表HTML
    const activitiesHtml = dayPlan.activities
      .map((activity, index) => this.generateActivityHtml(activity, index))
      .join('\n');

    // 生成图片网格HTML
    const imagesHtml = images
      .map(img => `<img src="${img}" alt="${dayPlan.theme}" class="w-full h-32 object-cover rounded-lg" />`)
      .join('\n');

    // 生成高德地图链接
    const mapUrl = this.generateMapUrl(
      dayPlan.activities[0]?.location?.lat || 0,
      dayPlan.activities[0]?.location?.lng || 0,
      dayPlan.city
    );

    return `
      <section class="day-section mb-8" data-day="${dayPlan.day}">
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <!-- 天数标题 -->
          <div class="bg-${palette}-500 text-white p-6">
            <h2 class="text-2xl font-bold">Day ${dayPlan.day}: ${dayPlan.title}</h2>
            <p class="text-${palette}-100 mt-1">${dayPlan.theme}</p>
          </div>

          <div class="grid lg:grid-cols-2 gap-6 p-6">
            <!-- 左侧：视觉内容 -->
            <div class="space-y-4">
              <!-- 图片网格 -->
              <div class="grid grid-cols-2 gap-3">
                ${imagesHtml}
              </div>

              <!-- 地图卡片 -->
              <a href="${mapUrl}" target="_blank" class="block bg-blue-50 hover:bg-blue-100 rounded-xl p-4 transition-colors">
                <div class="flex items-center space-x-3">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <div>
                    <p class="font-medium text-blue-900">在高德地图中查看</p>
                    <p class="text-sm text-blue-600">一键导航至第一天起点</p>
                  </div>
                </div>
              </a>

              <!-- 修改按钮 -->
              <button onclick="window.parent.postMessage({type:'modify_day', day:${dayPlan.day}}, '*')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl p-4 transition-colors">
                <span class="font-medium">我想修改 Day ${dayPlan.day}</span>
              </button>
            </div>

            <!-- 右侧：活动详情 -->
            <div class="space-y-4">
              ${activitiesHtml}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * 生成单个活动的HTML
   */
  private generateActivityHtml(activity: Activity, _index: number): string {
    const mapUrl = activity.location?.lat && activity.location?.lng
      ? this.generateMapUrl(activity.location.lat, activity.location.lng, this.daySkeleton.city)
      : '#';

    return `
      <div class="activity-item bg-${this.tripSkeleton.palette}-50 rounded-xl p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start space-x-3">
          <!-- 时间 -->
          <div class="flex-shrink-0 w-16 text-center">
            <span class="inline-block bg-${this.tripSkeleton.palette}-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              ${activity.time}
            </span>
          </div>

          <!-- 内容 -->
          <div class="flex-1">
            <h3 class="font-bold text-lg text-slate-800">${activity.title}</h3>
            <p class="text-slate-600 text-sm mt-1">${activity.description}</p>

            ${activity.location?.name ? `
              <a href="${mapUrl}" target="_blank" class="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ${activity.location.name}
              </a>
            ` : ''}

            ${activity.tips ? `
              <div class="mt-2 p-2 bg-yellow-50 rounded-lg">
                <p class="text-xs text-yellow-800">💡 ${activity.tips}</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 生成高德地图链接
   */
  private generateMapUrl(lat: number, lng: number, city: string): string {
    return `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(city)}`;
  }

  /**
   * 创建GLM客户端
   */
  private createGLMClient(): GLMClient {
    return getGlmClient();
  }
}

/**
 * 并行生成多天的行程
 * @param daySkeletons 天数骨架列表
 * @param tripSkeleton 完整行程骨架
 * @param concurrency 并发数（默认3）
 */
export async function generateDaysParallel(
  daySkeletons: DayPlanSkeleton[],
  tripSkeleton: TripSkeleton,
  concurrency: number = 3
): Promise<DayGenerationResult[]> {
  const results: DayGenerationResult[] = [];

  // 分批并行处理
  for (let i = 0; i < daySkeletons.length; i += concurrency) {
    const batch = daySkeletons.slice(i, i + concurrency);

    const batchPromises = batch.map(skeleton => {
      const agent = new DayAgent(skeleton, tripSkeleton);
      return agent.generate();
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  // 按天数排序
  return results.sort((a, b) => a.dayNumber - b.dayNumber);
}

/**
 * 创建DayAgent实例的工厂函数
 */
export function createDayAgent(
  daySkeleton: DayPlanSkeleton,
  tripSkeleton: TripSkeleton,
  glmClient?: GLMClient
): DayAgent {
  return new DayAgent(daySkeleton, tripSkeleton, glmClient);
}
