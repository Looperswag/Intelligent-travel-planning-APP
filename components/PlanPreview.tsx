import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { ViewMode, ShareData } from '../types';
import { OrganizerView } from './views/OrganizerView';
import { TravelerView } from './views/TravelerView';
import { Users, User, Eye } from 'lucide-react';

interface PlanPreviewProps {
  htmlContent: string;
  shareData?: ShareData | null;
}

export interface PlanPreviewHandle {
  print: () => void;
}

export const PlanPreview = forwardRef<PlanPreviewHandle, PlanPreviewProps>(({ htmlContent, shareData }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TRAVELER); // 默认显示旅行者视图

  useImperativeHandle(ref, () => ({
    print: () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.print();
      }
    }
  }));

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);

  // 如果没有分享数据，只显示原始HTML
  if (!shareData) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden border border-gray-200">
        <iframe
          ref={iframeRef}
          title="Travel Plan Preview"
          className="w-full h-full"
          sandbox="allow-scripts allow-popups allow-same-origin allow-modals"
        />
      </div>
    );
  }

  // 有分享数据时，显示多视图切换
  return (
    <div className="w-full h-full flex flex-col bg-morandi-base/30 rounded-lg shadow-inner overflow-hidden border border-morandi-base/30">
      {/* View Toggle Bar */}
      <div className="flex items-center gap-2 p-3 bg-white border-b border-morandi-base/30">
        <span className="text-xs font-medium text-morandi-dust tracking-widest uppercase mr-2">
          视图模式
        </span>

        <button
          onClick={() => setViewMode(ViewMode.TRAVELER)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
            ${viewMode === ViewMode.TRAVELER
              ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
              : 'bg-morandi-base/30 text-morandi-slate hover:bg-morandi-base/50'
            }
          `}
        >
          <User size={16} />
          旅行者视图
        </button>

        <button
          onClick={() => setViewMode(ViewMode.ORGANIZER)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
            ${viewMode === ViewMode.ORGANIZER
              ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-400'
              : 'bg-morandi-base/30 text-morandi-slate hover:bg-morandi-base/50'
            }
          `}
        >
          <Users size={16} />
          组织者视图
        </button>

        <div className="flex-1"></div>

        <button
          onClick={() => setViewMode(ViewMode.TRAVELER)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200
            ${viewMode === ViewMode.TRAVELER
              ? 'bg-morandi-sage text-white'
              : 'bg-morandi-base/30 text-morandi-slate hover:bg-morandi-base/50'
            }
          `}
          title="查看原始HTML报告"
        >
          <Eye size={14} />
          原始报告
        </button>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === ViewMode.ORGANIZER ? (
          <OrganizerView shareData={shareData} />
        ) : viewMode === ViewMode.TRAVELER ? (
          <TravelerView shareData={shareData} />
        ) : (
          <div className="w-full h-full bg-white">
            <iframe
              ref={iframeRef}
              title="Travel Plan Preview"
              className="w-full h-full"
              sandbox="allow-scripts allow-popups allow-same-origin allow-modals"
            />
          </div>
        )}
      </div>
    </div>
  );
});

PlanPreview.displayName = 'PlanPreview';