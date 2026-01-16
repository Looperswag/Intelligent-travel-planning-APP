/**
 * OrganizerView - 组织者视图组件
 *
 * 为行程组织者提供的完整信息视图：
 * - 准备物品清单
 * - 预算估算
 * - 紧急联系人
 * - 重要提醒
 */

import React from 'react';
import { ShareData } from '../../types';
import {
  Package,
  DollarSign,
  Phone,
  StickyNote,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface OrganizerViewProps {
  shareData: ShareData;
}

export const OrganizerView: React.FC<OrganizerViewProps> = ({ shareData }) => {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set(['衣物', '证件']));

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const { packingList, budgetEstimate, emergencyContacts, notes } = shareData.organizerView;

  // 按类别分组打包清单
  const packingByCategory = packingList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof packingList>);

  // 计算总预算
  const totalBudget = budgetEstimate.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">📋 行程准备清单</h2>
        <p className="text-slate-600">为你的旅行做好充分准备</p>
      </div>

      {/* 打包清单 */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Package className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-slate-800">打包清单</h3>
        </div>

        <div className="space-y-3">
          {Object.entries(packingByCategory).map(([category, items]) => (
            <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="font-medium text-slate-700">{category}</span>
                {expandedCategories.has(category) ? (
                  <ChevronUp className="w-5 h-5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500" />
                )}
              </button>

              {expandedCategories.has(category) && (
                <div className="p-4 space-y-2 bg-white">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                      <input
                        type="checkbox"
                        className="mt-1 w-5 h-5 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{item.item}</span>
                          {item.essential && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                              必需
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          数量：{item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 预算估算 */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <DollarSign className="w-6 h-6 text-green-600 mr-3" />
          <h3 className="text-xl font-bold text-slate-800">预算估算</h3>
        </div>

        <div className="space-y-4 mb-6">
          {budgetEstimate.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="font-medium text-slate-800">{item.category}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {item.items?.join('、')}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-green-600">
                  ¥{item.amount.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-slate-200 pt-4 flex items-center justify-between">
          <span className="text-lg font-medium text-slate-800">总预算</span>
          <span className="text-2xl font-bold text-green-600">
            ¥{totalBudget.toLocaleString()}
          </span>
        </div>
      </section>

      {/* 紧急联系人 */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Phone className="w-6 h-6 text-red-600 mr-3" />
          <h3 className="text-xl font-bold text-slate-800">紧急联系人</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {emergencyContacts.map((contact, index) => (
            <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="text-sm text-red-600 mb-1">{contact.type}</div>
              <div className="font-medium text-slate-800 mb-2">{contact.name}</div>
              <a
                href={`tel:${contact.phone}`}
                className="text-lg font-bold text-red-700 hover:text-red-800"
              >
                {contact.phone}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 重要提醒 */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-amber-200">
        <div className="flex items-center mb-4">
          <StickyNote className="w-6 h-6 text-amber-600 mr-3" />
          <h3 className="text-xl font-bold text-slate-800">重要提醒</h3>
        </div>

        <p className="text-slate-700 leading-relaxed">
          {notes}
        </p>
      </section>

      {/* 打印按钮 */}
      <div className="flex justify-center">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
        >
          <Check className="w-5 h-5" />
          打印清单
        </button>
      </div>
    </div>
  );
};

export default OrganizerView;
