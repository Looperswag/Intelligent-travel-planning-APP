/**
 * 亲子家庭场景模板
 * SceneType: FAMILY
 */

import { SceneTemplate } from '../../types';
import { SceneType } from '../../types';

export const familyTemplate: SceneTemplate = {
  type: SceneType.FAMILY,
  name: '亲子家庭游',
  description: '适合全家出游的轻松行程，老少皆宜',

  promptHints: [
    '选择亲子友好的景点',
    '安排儿童娱乐活动',
    '考虑老人和小孩的体力',
    '包含家庭友好餐厅',
    '节奏轻松，避免赶路',
    '增加休息时间'
  ],

  colorPalette: 'amber',
  fontConfig: {
    headingFont: 'Nunito',
    bodyFont: 'Open Sans',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Open+Sans:wght@300;400;600&display=swap'
  },

  htmlTemplate: `
<div class="family-enhancements">
  <div class="family-tip-card bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg mb-6">
    <div class="flex items-start">
      <span class="text-2xl mr-3">👨‍👩‍👧‍👦</span>
      <div>
        <h4 class="font-bold text-amber-900 mb-1">家庭出行提示</h4>
        <p class="text-sm text-amber-700">建议早上9点出发，避开人流高峰，让孩子有充足精力游玩</p>
      </div>
    </div>
  </div>
</div>
`
};

export default familyTemplate;
