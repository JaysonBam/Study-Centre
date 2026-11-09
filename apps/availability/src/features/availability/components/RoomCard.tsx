import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import { STYLES, CARD_VARIANTS } from './styles';
import type { DurationCounts } from '@/api/types';
import { calculateTotalAvailable, getTrafficLight, DURATION_LABELS } from '../model/time';

interface RoomCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  counts: DurationCounts;
  totalCapacity: number;
  className?: string;
}

export function RoomCard({ title, subtitle, icon, counts, totalCapacity, className = '' }: RoomCardProps) {
  const availableCount = calculateTotalAvailable(counts);
  const status = getTrafficLight(availableCount, totalCapacity);
  const percentage = Math.min(100, (availableCount / totalCapacity) * 100);

  const activeStyle = CARD_VARIANTS[status as keyof typeof CARD_VARIANTS];
  const durationOrder = ['120', '90', '60', '30'];

  return (
    <div className={STYLES.roomCard.container(activeStyle, className)}>
      <div className={STYLES.roomCard.innerContent}>
        {/* Top Row: Title (Left) & Subtitle (Right) */}
        <div className={STYLES.roomCard.iconTitleRow}>
          <div className="flex items-center gap-2 lg:gap-4">
            {icon}
            <h3 className={`font-semibold ${activeStyle.textMain} text-lg lg:text-4xl lg:tracking-tight`}>
              {title}
            </h3>
          </div>
          <div className={STYLES.roomCard.subtitleTag(activeStyle)}>
            <Users className="w-3 h-3 lg:w-6 lg:h-6" />
            {subtitle}
          </div>
        </div>

        {/* Bottom Row: Breakdown (Left) & Total (Right) */}
        <div className={STYLES.roomCard.breakdownRow}>
          {/* Breakdown List */}
          <div className="space-y-0.5 pt-1 lg:space-y-1">
            {availableCount > 0 ? (
              durationOrder.map((durationKey) => {
                const count = counts[durationKey] || 0;
                if (count === 0) return null;

                return (
                  <div key={durationKey} className={STYLES.roomCard.breakdownItem(activeStyle)}>
                    <span className="opacity-60 mr-1.5 lg:mr-2">→</span>
                    <span className="font-bold mr-1 lg:mr-2 text-base lg:text-4xl">{count}</span>
                    <span className="opacity-80">available for {DURATION_LABELS[durationKey]}</span>
                  </div>
                );
              })
            ) : (
              <div className={STYLES.roomCard.zeroState(activeStyle)}>Nothing available</div>
            )}
          </div>

          {/* Total Count */}
          <div className="text-right pl-4 lg:pl-8">
            <span className={STYLES.roomCard.totalCount(activeStyle)}>{availableCount}</span>
            <span className={STYLES.roomCard.totalLabel(activeStyle)}>/ {totalCapacity}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 lg:h-3 bg-black/5">
        <div className={STYLES.roomCard.progressBar(activeStyle)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
