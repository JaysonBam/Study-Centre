import { STYLES } from './styles';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GridSlot } from '@/api/types';

interface MobileNavProps {
  currentSlot: GridSlot | undefined;
  onPrev: () => void;
  onNext: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}

export function MobileNav({ currentSlot, onPrev, onNext, isPrevDisabled, isNextDisabled }: MobileNavProps) {
  return (
    <div className={STYLES.mobileNav.container}>
      <button onClick={onPrev} disabled={isPrevDisabled} className={STYLES.mobileNav.button(isPrevDisabled)}>
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time Slot</div>
        <div className="text-xl font-bold text-slate-800 tabular-nums">
          {currentSlot ? `${currentSlot.start} - ${currentSlot.end}` : '-- : --'}
        </div>
      </div>

      <button onClick={onNext} disabled={isNextDisabled} className={STYLES.mobileNav.button(isNextDisabled)}>
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
