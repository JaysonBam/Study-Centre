export interface DurationCounts {
  [duration: string]: number;
}

export interface SlotAvailability {
  'open room': DurationCounts;
  'closed room': DurationCounts;
  boardroom: DurationCounts;
}

export interface GridSlot {
  start: string;
  end: string;
  availability: SlotAvailability;
}

export interface Totals {
  'open room': number;
  'closed room': number;
  boardroom: number;
}

export interface OperationHours {
  start: string;
  end: string;
}

export interface SaturdayHours {
  start: string;
  end: string;
  enabled: boolean;
}

export interface AvailabilityData {
  totals: Totals;
  grid: GridSlot[];
  operation_hours: OperationHours;
  saturday_hours: SaturdayHours;
}
