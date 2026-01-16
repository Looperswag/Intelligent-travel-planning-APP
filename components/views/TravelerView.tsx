/**
 * TravelerView - 旅行者视图组件
 *
 * 为普通旅行者提供的简洁视图：
 * - 快速概览
 * - 每日亮点
 * - 必看必做
 * - 必要信息
 */

import React from 'react';
import { ShareData } from '../../types';
import {
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  Globe,
  DollarSign,
  Zap,
  Eye,
  CheckCircle
} from 'lucide-react';

interface TravelerViewProps {
  shareData: ShareData;
}

export const TravelerView: React.FC<TravelerViewProps> = ({ shareData }) => {
  const { quickOverview, dailyHighlights, essentialInfo } = shareData.travelerView;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">✨ 旅程精华</h2>
        <p className="text-slate-600">快速了解你的旅行亮点</p>
      </div>

      {/* 快速概览 */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-start mb-4">
          <Sparkles className="w-6 h-6 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold mb-2">旅程精华</h3>
            <p className="text-lg leading-relaxed opacity-95">
              {quickOverview}
            </p>
          </div>
        </div>
      </section>

      {/* 每日亮点 */}
      <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-slate-50 p-6 border-b">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-bold text-slate-800">每日亮点</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {dailyHighlights.map((day) => (
              <div key={day.day} className="border-l-4 border-blue-500 pl-6 py-2">
                <div className="flex items-center mb-3">
                  <span className="text-3xl font-bold text-blue-600 mr-3">
                    Day {day.day}
                  </span>
                  <h4 className="text-lg font-bold text-slate-800">{day.title}</h4>
                </div>

                <p className="text-slate-700 mb-4 italic">
                  "{day.highlight}"
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* 必看景点 */}
                  {day.mustSee && day.mustSee.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <Eye className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium text-green-900">必看景点</span>
                      </div>
                      <ul className="space-y-1">
                        {day.mustSee.map((item, index) => (
                          <li key={index} className="text-sm text-green-800">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 必做事项 */}
                  {day.mustDo && day.mustDo.length > 0 && (
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 text-orange-600 mr-2" />
                        <span className="font-medium text-orange-900">必做事项</span>
                      </div>
                      <ul className="space-y-1">
                        {day.mustDo.map((item, index) => (
                          <li key={index} className="text-sm text-orange-800">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 必要信息 */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <MapPin className="w-6 h-6 text-purple-600 mr-3" />
          <h3 className="text-xl font-bold text-slate-800">必要信息</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InfoItem icon={<Globe />} label="目的地" value={essentialInfo.destination} />
            <InfoItem icon={<Clock />} label="最佳季节" value={essentialInfo.bestSeason} />
            <InfoItem icon={<Globe />} label="语言" value={essentialInfo.language} />
            <InfoItem icon={<DollarSign />} label="货币" value={essentialInfo.currency} />
          </div>

          <div className="space-y-4">
            <InfoItem icon={<Clock />} label="时区" value={essentialInfo.timezone} />
            <InfoItem icon={<Zap />} label="电压" value={essentialInfo.voltage} />
            <InfoItem
              icon={<Phone />}
              label="紧急电话"
              value={essentialInfo.emergencyNumber}
              highlight
            />
            <InfoItem icon={<Calendar />} label="天数" value={`${essentialInfo.duration}天`} />
          </div>
        </div>
      </section>

      {/* 快速分享 */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: '我的旅行计划',
                text: quickOverview,
              });
            }
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
        >
          <Share className="w-5 h-5" />
          分享给朋友
        </button>
      </div>
    </div>
  );
};

// 辅助组件：信息项
interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, highlight }) => {
  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${highlight ? 'bg-red-100' : 'bg-slate-100'}`}>
      <div className={highlight ? 'text-red-600' : 'text-slate-600'}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
      <IconWrapper>{icon}</IconWrapper>
      <div>
        <div className="text-xs text-slate-600 mb-0.5">{label}</div>
        <div className={`font-medium ${highlight ? 'text-red-700' : 'text-slate-800'}`}>
          {value}
        </div>
      </div>
    </div>
  );
};

// Phone图标
function Phone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

// Share图标
function Share({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

export default TravelerView;
