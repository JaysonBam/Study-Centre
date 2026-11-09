import { useEffect, useState } from 'react';
import { getAvailability } from '@/api/availability';
import type { AvailabilityData, GridSlot } from '@/api/types';
import { formatTime } from '../model/time';

export function useAvailability() {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isAfterHours, setIsAfterHours] = useState(false);

  // Navigation State
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number>(-1);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const responseData = await getAvailability(new Date().toISOString().split('T')[0]);

      setData(responseData);
      setLastUpdated(new Date());

      const currentDate = new Date();
      const nowTime = formatTime(currentDate);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, ..., 6 = Saturday

      let isOpen = false;

      // 1. Sunday: Always Closed
      if (dayOfWeek === 0) {
        isOpen = false;
      }
      // 2. Saturday: Check config
      else if (dayOfWeek === 6) {
        if (responseData.saturday_hours?.enabled) {
          const { start, end } = responseData.saturday_hours;
          isOpen = nowTime >= start && nowTime < end;
        } else {
          isOpen = false;
        }
      }
      // 3. Weekdays: Check Operation Hours
      else {
        // Default to grid bounds if operation_hours missing
        const start = responseData.operation_hours?.start || responseData.grid?.[0]?.start || '00:00';
        const end =
          responseData.operation_hours?.end ||
          responseData.grid?.[responseData.grid.length - 1]?.end ||
          '23:59';
        isOpen = nowTime >= start && nowTime < end;
      }

      if (!isOpen) {
        setIsAfterHours(true);
      } else {
        setIsAfterHours(false);

        if (responseData?.grid && responseData.grid.length > 0) {
          // Find current or next slot
          let index = responseData.grid.findIndex(
            (slot: GridSlot) => nowTime >= slot.start && nowTime < slot.end,
          );

          if (index === -1) {
            const nextSlotIndex = responseData.grid.findIndex((slot: GridSlot) => slot.start > nowTime);
            index = nextSlotIndex !== -1 ? nextSlotIndex : 0;
          }
          setCurrentSlotIndex(index);
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching availability:', err);
      setError(err instanceof Error && err.message ? err.message : 'Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Keyboard Polling Toggle (Ctrl + L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Control + L (case insensitive)
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLiveMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Mode Polling (Every 5s)
  useEffect(() => {
    if (!isLiveMode) return;

    // Refresh immediately on toggle
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  // Handlers
  const handleNext = () => {
    if (data && currentSlotIndex < data.grid.length - 1) {
      setCurrentSlotIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlotIndex > 0) {
      setCurrentSlotIndex((prev) => prev - 1);
    }
  };

  // Derived state for the currently displayed slot
  const currentSlot = data?.grid?.[currentSlotIndex];

  // Determine if nav buttons should be disabled
  const isPrevDisabled = currentSlotIndex <= 0;
  const isNextDisabled = !data || !data.grid || currentSlotIndex >= data.grid.length - 1;

  return {
    data,
    loading,
    error,
    lastUpdated,
    isLiveMode,
    isAfterHours,
    currentSlot,
    isPrevDisabled,
    isNextDisabled,
    fetchData,
    handleNext,
    handlePrev,
  };
}
