/**
 * 浪漫旅行场景模板
 * SceneType: ROMANTIC
 *
 * 适用场景：情侣、蜜月、纪念日、求婚
 * 核心元素：浪漫氛围、二人世界、精致体验
 */

import { SceneTemplate } from '../../types';
import { SceneType } from '../../types';

export const romanticTemplate: SceneTemplate = {
  type: SceneType.ROMANTIC,
  name: '浪漫之旅',
  description: '为情侣精心设计的浪漫旅程，创造美好回忆',

  promptHints: [
    '推荐浪漫餐厅和咖啡厅',
    '安排日落观景点',
    '包含二人体验活动（如情侣SPA、游船）',
    '住宿选择有特色的精品酒店',
    '节奏放缓，享受二人世界',
    '避免过于拥挤的景点'
  ],

  colorPalette: 'rose',
  fontConfig: {
    headingFont: 'Playfair Display',
    bodyFont: 'Lato',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:wght@400;700&display=swap'
  },

  htmlTemplate: `
<!-- 浪漫旅行专属元素 -->
<div class="romantic-enhancements">
  <!-- 浪漫提示卡片 -->
  <div class="romantic-tip-card bg-rose-50 border-l-4 border-rose-400 p-4 rounded-lg mb-6">
    <div class="flex items-start">
      <span class="text-2xl mr-3">💕</span>
      <div>
        <h4 class="font-bold text-rose-900 mb-1">浪漫小贴士</h4>
        <p class="text-sm text-rose-700">建议在日落时分前往 {VIEWPOINT}，这是当地最浪漫的观景点</p>
      </div>
    </div>
  </div>

  <!-- 浪漫活动推荐 -->
  <div class="romantic-activities bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 mb-6">
    <h4 class="font-bold text-rose-900 mb-4 flex items-center">
      <span class="mr-2">💑</span> 浪漫体验推荐
    </h4>
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <span class="text-2xl">🍷</span>
        <h5 class="font-medium text-rose-900">红酒品鉴</h5>
        <p class="text-xs text-rose-600 mt-1">在当地酒庄共品佳酿</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <span class="text-2xl">🌅</span>
        <h5 class="font-medium text-rose-900">日落游船</h5>
        <p class="text-xs text-rose-600 mt-1">黄昏时分浪漫游船</p>
      </div>
    </div>
  </div>
</div>
`
};

export default romanticTemplate;
