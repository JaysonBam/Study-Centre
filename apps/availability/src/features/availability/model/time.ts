import type { DurationCounts } from '@/api/types';

export const DURATION_LABELS: Record<string, string> = {
  '120': '2 hours',
  '90': '1.5 hours',
  '60': '1 hour',
  '30': '30 min',
};

export const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const getTrafficLight = (available: number, total: number) => {
  if (available === 0) return 'full';
  const percentage = (available / total) * 100;
  if (percentage <= 25) return 'critical';
  if (percentage <= 50) return 'low';
  return 'high';
};

export const calculateTotalAvailable = (counts: DurationCounts) => {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
};
