import { Calendar, X } from 'lucide-react';
import { DayPlanSkeleton } from '../types';

interface DaySelectorProps {
  days: DayPlanSkeleton[];
  onSelect: (day: number) => void;
  onCancel: () => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  days,
  onSelect,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-morandi-base animate-scale-in flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-morandi-base flex justify-between items-center bg-morandi-base/30">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-morandi-slate" />
            <h3 className="font-bold text-morandi-charcoal">选择要修改的天数</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-morandi-base rounded-full transition-colors"
          >
            <X size={18} className="text-morandi-slate" />
          </button>
        </div>

        {/* Days grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 custom-scrollbar">
          {days.map(day => (
            <button
              key={day.day}
              onClick={() => onSelect(day.day)}
              className="relative p-4 bg-white rounded-xl border border-morandi-clay/30
                         hover:border-morandi-sage hover:shadow-md
                         transition-all text-left group"
            >
              {/* Day number badge */}
              <div className="absolute top-3 right-3 text-3xl font-black
                          text-morandi-sage/10 group-hover:text-morandi-sage/20
                          transition-colors">
                {String(day.day).padStart(2, '0')}
              </div>

              {/* Day content */}
              <div className="relative z-10">
                <div className="text-xs font-bold text-morandi-sage mb-1">
                  Day {day.day}
                </div>
                <div className="text-sm font-bold text-morandi-charcoal mb-2">
                  {day.title}
                </div>
                <div className="text-xs text-morandi-slate flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-morandi-accent rounded-full"></span>
                  {day.theme}
                </div>
                <div className="text-xs text-morandi-dust mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-morandi-clay rounded-full"></span>
                  {day.city}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-morandi-base bg-morandi-base/20">
          <button
            onClick={onCancel}
            className="w-full py-2.5 text-morandi-slate hover:text-morandi-charcoal
                       hover:bg-morandi-base rounded-lg transition-all text-sm font-medium"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirmation dialog for suggested day
interface DayConfirmationProps {
  suggestedDay: number;
  dayTitle: string;
  onConfirm: () => void;
  onDeny: () => void;
}

export const DayConfirmation: React.FC<DayConfirmationProps> = ({
  suggestedDay,
  dayTitle,
  onConfirm,
  onDeny
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-morandi-base animate-scale-in">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-morandi-sage/10 rounded-full flex items-center justify-center">
              <Calendar size={18} className="text-morandi-sage" />
            </div>
            <div>
              <h3 className="font-bold text-morandi-charcoal">确认修改天数</h3>
              <p className="text-xs text-morandi-slate">检测到您想修改某一天的行程</p>
            </div>
          </div>

          <div className="bg-morandi-base/50 rounded-xl p-4 mb-4">
            <div className="text-sm text-morandi-slate mb-1">检测到要修改的天数</div>
            <div className="text-lg font-bold text-morandi-charcoal">
              Day {suggestedDay}: {dayTitle}
            </div>
          </div>

          <p className="text-sm text-morandi-slate mb-6">
            是否正确？如果正确，请点击确认开始修改。如果需要选择其他天数，请点击选择其他天数。
          </p>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-morandi-charcoal text-white rounded-lg
                         hover:bg-black transition-all font-medium text-sm"
            >
              确认修改
            </button>
            <button
              onClick={onDeny}
              className="flex-1 py-3 bg-morandi-base text-morandi-slate rounded-lg
                         hover:bg-morandi-clay/50 transition-all font-medium text-sm"
            >
              选择其他天数
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
