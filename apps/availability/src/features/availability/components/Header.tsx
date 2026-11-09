import { STYLES } from './styles';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { formatTime } from '../model/time';
import type { GridSlot } from '@/api/types';

interface HeaderProps {
  isLiveMode: boolean;
  currentSlot: GridSlot | undefined;
  onPrev: () => void;
  onNext: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export function Header({
  isLiveMode,
  currentSlot,
  onPrev,
  onNext,
  isPrevDisabled,
  isNextDisabled,
  lastUpdated,
  onRefresh,
  loading,
}: HeaderProps) {
  return (
    <header className={STYLES.header.container}>
      <div className={STYLES.header.inner}>
        <div className={STYLES.header.flexRow}>
          {/* Left: Brand */}
          <div className={STYLES.header.brandContainer}>
            <div className="flex flex-col">
              <h1 className={STYLES.header.brandTitle}>MISC CDIO</h1>
              <span className={STYLES.header.brandSubtitle}>Room Availability</span>
            </div>
          </div>

          {/* Center: Desktop Nav (Absolute Center) */}
          <div className={STYLES.header.centerNav}>
            {!isLiveMode && (
              <button
                onClick={onPrev}
                disabled={isPrevDisabled}
                className={`p-1 transition-all ${isPrevDisabled ? 'text-slate-300' : 'text-slate-400 hover:text-emerald-600 hover:scale-110 active:scale-95'}`}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            <div className={STYLES.header.timerContainer(isLiveMode)}>
              <span className={STYLES.header.timerText}>
                {currentSlot ? `${currentSlot.start} - ${currentSlot.end}` : '-- : --'}
              </span>
            </div>

            {!isLiveMode && (
              <button
                onClick={onNext}
                disabled={isNextDisabled}
                className={`p-1 transition-all ${isNextDisabled ? 'text-slate-300' : 'text-slate-400 hover:text-emerald-600 hover:scale-110 active:scale-95'}`}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>

          {/* Right: Status */}
          <div className="flex items-center gap-3 lg:gap-6 z-10">
            {isLiveMode ? (
              <div className={STYLES.header.liveBadge}>
                <div className="size-2 bg-emerald-600 rounded-full"></div>
                <span className="text-xs lg:text-sm font-bold tracking-wider">LIVE</span>
              </div>
            ) : (
              <>
                <span className="text-slate-400 text-xs lg:text-base font-medium">
                  Updated {lastUpdated ? formatTime(lastUpdated) : '--:--'}
                </span>
                <button
                  onClick={onRefresh}
                  className={`p-2 -mr-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-full transition-all duration-500 ${loading ? 'animate-spin-reverse text-emerald-600' : 'active:rotate-180'}`}
                  aria-label="Refresh"
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4 lg:w-6 lg:h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
