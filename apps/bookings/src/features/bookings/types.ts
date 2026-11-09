export interface BookingPanelProps {
  open: boolean;
  onClose: () => void;
  prefill?: { roomId?: string; timeSlot?: string; booking?: any } | null;
  defaultStaffName?: string;
  showToast?: (title: string, description: string, severity?: 'success' | 'error' | 'info') => void;
  onBookingUpdate?: (staffName?: string) => void;
  rooms: any[];
  courses: any[];
  creationStartTime?: number | null;
}
