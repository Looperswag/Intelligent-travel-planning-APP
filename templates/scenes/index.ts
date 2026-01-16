/**
 * 场景模板索引
 * 所有场景类型的配置和模板
 */

import { SceneType, SceneTemplate } from '../../types';
import { romanticTemplate } from './romantic';
import { familyTemplate } from './family';

/**
 * 场景模板配置映射
 */
export const SCENE_TEMPLATES: Record<SceneType, SceneTemplate> = {
  [SceneType.ROMANTIC]: romanticTemplate,
  [SceneType.FAMILY]: familyTemplate,
  [SceneType.ADVENTURE]: {
    type: SceneType.ADVENTURE,
    name: '户外探险',
    description: '勇敢者的旅程，挑战极限',
    promptHints: [
      '安排户外探险活动',
      '包含徒步、攀岩等',
      '选择有挑战性的路线',
      '推荐专业向导',
      '注意安全事项',
      '准备装备清单'
    ],
    colorPalette: 'emerald',
    fontConfig: {
      headingFont: 'Oswald',
      bodyFont: 'Roboto',
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Roboto:wght@300;400;500&display=swap'
    },
    htmlTemplate: `<div class="adventure-badge bg-emerald-100 text-emerald-900 px-4 py-2 rounded-full inline-block mb-4">🏔️ 探险模式</div>`
  },
  [SceneType.BUSINESS]: {
    type: SceneType.BUSINESS,
    name: '商务出行',
    description: '高效商务旅行，工作与体验兼顾',
    promptHints: [
      '高效行程安排',
      '靠近会议中心',
      '商务餐厅推荐',
      '高速网络保障',
      '交通便捷优先',
      '预留工作时间'
    ],
    colorPalette: 'slate',
    fontConfig: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    },
    htmlTemplate: `<div class="business-badge bg-slate-100 text-slate-900 px-4 py-2 rounded-full inline-block mb-4">💼 商务出行</div>`
  },
  [SceneType.FOODIE]: {
    type: SceneType.FOODIE,
    name: '美食之旅',
    description: '品味地道美食，探索味蕾之旅',
    promptHints: [
      '推荐当地特色美食',
      '安排美食市场探访',
      '包含烹饪体验',
      '米其林/当地名店',
      '街头小吃探索',
      '美食文化体验'
    ],
    colorPalette: 'orange',
    fontConfig: {
      headingFont: 'Merriweather',
      bodyFont: 'Source Sans Pro',
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+Pro:wght@300;400;600&display=swap'
    },
    htmlTemplate: `<div class="foodie-badge bg-orange-100 text-orange-900 px-4 py-2 rounded-full inline-block mb-4">🍜 美食探索</div>`
  },
  [SceneType.CULTURE]: {
    type: SceneType.CULTURE,
    name: '文化深度游',
    description: '深度文化体验，感受历史底蕴',
    promptHints: [
      '历史文化景点',
      '博物馆和艺术馆',
      '当地文化体验',
      '传统工艺探访',
      '历史讲解服务',
      '文化演出推荐'
    ],
    colorPalette: 'indigo',
    fontConfig: {
      headingFont: 'Crimson Text',
      bodyFont: 'Lora',
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&family=Lora:wght@300;400;500&display=swap'
    },
    htmlTemplate: `<div class="culture-badge bg-indigo-100 text-indigo-900 px-4 py-2 rounded-full inline-block mb-4">🏛️ 文化之旅</div>`
  },
  [SceneType.RELAXATION]: {
    type: SceneType.RELAXATION,
    name: '休闲度假',
    description: '放松身心，享受悠闲时光',
    promptHints: [
      '慢节奏行程',
      '度假村/温泉酒店',
      'SPA和按摩',
      '自然风光欣赏',
      '充足自由时间',
      '轻松惬意体验'
    ],
    colorPalette: 'teal',
    fontConfig: {
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Montserrat',
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Montserrat:wght@300;400;500&display=swap'
    },
    htmlTemplate: `<div class="relax-badge bg-teal-100 text-teal-900 px-4 py-2 rounded-full inline-block mb-4">🏖️ 休闲度假</div>`
  },
  [SceneType.SOLO]: {
    type: SceneType.SOLO,
    name: '独行旅行',
    description: '独自出发，遇见未知的自己',
    promptHints: [
      '安全优先的路线',
      '青年旅舍/特色住宿',
      '社交机会安排',
      '自由探索时间',
      '当地体验活动',
      '摄影打卡点推荐'
    ],
    colorPalette: 'blue',
    fontConfig: {
      headingFont: 'Poppins',
      bodyFont: 'Raleway',
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Raleway:wght@300;400;500;600&display=swap'
    },
    htmlTemplate: `<div class="solo-badge bg-blue-100 text-blue-900 px-4 py-2 rounded-full inline-block mb-4">🎒 独行之旅</div>`
  }
};

/**
 * 根据场景类型获取模板
 */
export function getSceneTemplate(sceneType: SceneType): SceneTemplate {
  return SCENE_TEMPLATES[sceneType] || SCENE_TEMPLATES[SceneType.RELAXATION];
}

/**
 * 获取所有场景类型列表
 */
export function getAllSceneTypes(): SceneType[] {
  return Object.values(SceneType).filter(v => typeof v === 'string') as SceneType[];
}
