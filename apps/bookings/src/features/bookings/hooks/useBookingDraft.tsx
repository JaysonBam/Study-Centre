import { getOperationHours } from '@/api/settings';
import { getBookingGroup, listAvailabilityBookings } from '@/api/bookings';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { getRoomAvailability, rankRooms } from '../model/roomRecommendations';
import { useConfirm } from '../context/ConfirmDialogContext';
import { useNow } from '../context/NowContext';
import { type BookingRange } from '@/shared/lib/bookingEntry';
import type { BookingPanelProps } from '../types';

export function useBookingDraft({
  open,
  prefill = null,
  defaultStaffName = '',
  showToast = () => {},
  rooms,
}: BookingPanelProps) {
  const helpId = React.useId();

  const { confirm } = useConfirm();

  const { currentTime } = useNow();

  const [loading, setLoading] = useState(false);

  const [saveError, setSaveError] = useState('');

  const [roomId, setRoomId] = useState<string>(() => {
    if (prefill?.booking) return String(prefill.booking.room_id);
    return prefill?.roomId ?? '';
  });

  const [startDate, setStartDate] = useState<string>(() => {
    if (prefill?.booking) return prefill.booking.booking_day;
    if (prefill?.timeSlot) {
      try {
        return format(new Date(prefill.timeSlot), 'yyyy-MM-dd');
      } catch (e) {}
    }
    return format(new Date(), 'yyyy-MM-dd');
  });

  const [startClock, setStartClock] = useState<string>(() => {
    if (prefill?.booking) return prefill.booking.start_time.slice(0, 5);
    if (prefill?.timeSlot) {
      try {
        return format(new Date(prefill.timeSlot), 'HH:mm');
      } catch (e) {}
    }
    const now = new Date();
    now.setMinutes(Math.round(now.getMinutes() / 30) * 30);
    return format(now, 'HH:mm');
  });

  const [duration, setDuration] = useState<string>(() => {
    if (prefill?.booking) {
      try {
        const s = parseISO(`${prefill.booking.booking_day}T${prefill.booking.start_time}`);
        const e = parseISO(`${prefill.booking.booking_day}T${prefill.booking.end_time}`);
        const mins = Math.round((e.getTime() - s.getTime()) / 60000);
        return String(mins);
      } catch (e) {}
    }
    return '';
  });

  const [staffName, setStaffName] = useState<string>(() => {
    return prefill?.booking?.booked_by || defaultStaffName || '';
  });

  const [isNameManuallyTyped, setIsNameManuallyTyped] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsNameManuallyTyped(false);
    }
  }, [open]);

  useEffect(() => {
    if (!isNameManuallyTyped && !prefill?.booking) {
      setStaffName(defaultStaffName || '');
    }
  }, [defaultStaffName, isNameManuallyTyped, prefill?.booking]);

  const [studentNumbers, setStudentNumbers] = useState<string>(() => prefill?.booking?.student_numbers || '');

  const [totalStudents, setTotalStudents] = useState<string>('');

  const [isBulkCount, setIsBulkCount] = useState(false);

  useEffect(() => {
    const raw = prefill?.booking?.student_numbers || '';
    // Parse bulk marker format: bulk booking - <uuid> - <count>.
    const match = raw.match(/^bulk booking - ([0-9a-fA-F-]+) - (\d+)$/);

    if (prefill?.booking?.bulk_booking_id) {
      setIsBulkCount(true);
      if (match) {
        setTotalStudents(match[2]);
      } else {
        setTotalStudents(''); // Empty initially
      }
    } else {
      setIsBulkCount(false);
      setTotalStudents('');
    }
  }, [prefill?.booking]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (prefill?.booking?.course_id) return String(prefill.booking.course_id);
    if (prefill?.booking?.course_name) return 'other';
    return '';
  });

  const [otherCourseName, setOtherCourseName] = useState<string>(() => {
    if (prefill?.booking?.course_name && !prefill?.booking?.course_id) return prefill.booking.course_name;
    return '';
  });

  const [selectedExtension, setSelectedExtension] = useState<string>('');

  const [selectedState, setSelectedState] = useState<'Active' | 'Reserved' | 'Ended'>(
    () => (prefill?.booking?.state as any) ?? 'Active',
  );

  const [borrowableItems, setBorrowableItems] = useState<string[]>(() => {
    const targetId = prefill?.booking ? String(prefill.booking.room_id) : (prefill?.roomId ?? '');
    const r = rooms.find((x: any) => String(x.id) === targetId);
    return r?.borrowable_items || [];
  });

  const [selectedBorrowed, setSelectedBorrowed] = useState<Record<string, boolean>>(() => {
    const sel: Record<string, boolean> = {};
    if (prefill?.booking?.borrowed_items) {
      (prefill.booking.borrowed_items || []).forEach((it: string) => (sel[it] = true));
      return sel;
    }
    const targetId = prefill?.roomId ?? '';
    const r = rooms.find((x: any) => String(x.id) === targetId);
    (r?.borrowable_items || []).forEach((it: string) => (sel[it] = false));
    return sel;
  });

  const [availability, setAvailability] = useState<{ date: string; bookings: any[] } | null>(null);

  const availabilityReady = availability?.date === startDate;

  const dayBookings = useMemo(
    () => (availabilityReady ? availability!.bookings : []),
    [availability, availabilityReady],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const contentRef = useRef<HTMLDivElement>(null);

  const clearFieldError = (key: string) =>
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });

  const showFieldErrors = (next: Record<string, string>) => {
    setErrors(next);
    if (Object.keys(next).length)
      requestAnimationFrame(() => {
        contentRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
  };

  const [isBulkEdit, setIsBulkEdit] = useState(false);

  const [bulkGroupBookings, setBulkGroupBookings] = useState<any[]>([]);

  const [groupReady, setGroupReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGroupReady(false);
    setBulkGroupBookings([]);
    setIsBulkEdit(!!prefill?.booking?.bulk_booking_id);
    if (prefill?.booking?.bulk_booking_id) {
      getBookingGroup(prefill.booking.bulk_booking_id).then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.length) {
          setSaveError('Could not load the bulk group. Reopen the booking to try again.');
          return;
        }
        setBulkGroupBookings(data);
        setGroupReady(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [prefill?.booking]);

  const [isBulkBooking, setIsBulkBooking] = useState(false);

  const [bulkDates, setBulkDates] = useState<BookingRange[]>([
    { id: crypto.randomUUID(), start: '', end: '' },
  ]);

  const [bulkTimes, setBulkTimes] = useState<BookingRange[]>([
    { id: crypto.randomUUID(), start: '', end: '' },
  ]);

  const [bulkRoomIds, setBulkRoomIds] = useState<string[]>([]);

  const [isSmartSelecting, setIsSmartSelecting] = useState(false);

  const [rankedRooms, setRankedRooms] = useState<any[]>([]);

  const [currentRankIndex, setCurrentRankIndex] = useState(0);

  const [openingHours, setOpeningHours] = useState<{ start: string; end: string }>({
    start: '06:00',
    end: '21:00',
  });

  const [hoursReady, setHoursReady] = useState(false);

  const smartRequestId = useRef(0);

  const smartRequestedDuration = useRef('');

  useEffect(() => {
    smartRequestId.current += 1;
    setIsSmartSelecting(false);
    setRankedRooms([]);
    setCurrentRankIndex(0);
  }, [open, startDate, startClock, openingHours, rooms, currentTime]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setHoursReady(false);
    const loadHours = async () => {
      const { data, error } = await getOperationHours();
      if (cancelled) return;
      if (error) {
        showToast('Warning', 'Could not load opening hours', 'info');
        return;
      }
      const value = data?.value as any;
      setOpeningHours({
        start: value?.start ?? value?.open ?? '06:00',
        end: value?.end ?? value?.close ?? '21:00',
      });
      setHoursReady(true);
    };
    loadHours();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    setAvailability(null);
    if (!startDate || !open) return;
    let cancelled = false;
    const fetchBookings = async () => {
      const { data, error } = await listAvailabilityBookings(startDate);
      if (cancelled) return;
      if (error || !data) {
        showToast('Warning', 'Could not load availability data', 'info');
        return;
      }
      setAvailability({ date: startDate, bookings: data });
    };
    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, [startDate, open]);

  const roomRequest = useMemo(
    () => ({
      date: startDate,
      time: startClock,
      now: currentTime,
      openingHours,
      excludeBookingId: prefill?.booking?.id,
    }),
    [startDate, startClock, currentTime, openingHours, prefill?.booking?.id],
  );

  const availableDurationOptions = useMemo(() => {
    if (!availabilityReady || !hoursReady || !startClock) return duration ? [Number(duration)] : [];
    const { minutesAvailable: maxDuration } = getRoomAvailability(roomId, dayBookings, roomRequest);
    const options: number[] = [];
    for (let d = 30; d <= maxDuration && d <= 120; d += 30) options.push(d);

    const currentDur = parseInt(duration, 10);
    if (!isNaN(currentDur) && currentDur > 0 && !options.includes(currentDur)) {
      if (currentDur <= maxDuration || (prefill?.booking && currentDur <= 120)) {
        options.push(currentDur);
        options.sort((a, b) => a - b);
      }
    }
    return options;
  }, [
    startClock,
    dayBookings,
    prefill?.booking,
    duration,
    roomId,
    roomRequest,
    availabilityReady,
    hoursReady,
  ]);

  const availableExtensionOptions = useMemo(() => {
    if (!prefill?.booking) return [];
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const startMins = parseTime(startClock);
    const currentDuration = parseInt(duration, 10);
    if (isNaN(currentDuration)) return [];
    const endMins = startMins + currentDuration;

    const [closeH, closeM] = openingHours.end.split(':').map(Number);
    let limitMins = closeH * 60 + closeM;

    for (const b of dayBookings) {
      if (String(b.room_id) !== String(roomId)) continue;
      if (prefill?.booking && String(b.id) === String(prefill.booking.id)) continue;
      const bStart = parseTime(b.start_time);
      if (bStart >= endMins && bStart < limitMins) limitMins = bStart;
    }
    const maxExtension = limitMins - endMins;
    const options: number[] = [];
    for (let d = 30; d <= maxExtension && d <= 120; d += 30) options.push(d);
    return options;
  }, [startClock, duration, dayBookings, prefill?.booking, roomId, openingHours]);

  useEffect(() => {
    if (!availabilityReady || !hoursReady || isBulkEdit) return;
    const currentDur = parseInt(duration);
    if (availableDurationOptions.length > 0) {
      if (!duration || Number.isNaN(currentDur)) {
        if (prefill?.booking) {
          setDuration(String(availableDurationOptions[0]));
        }
        return;
      }
      const max = availableDurationOptions[availableDurationOptions.length - 1];
      if (currentDur > max) setDuration(String(max));
    } else {
      if (duration !== '') setDuration('');
    }
  }, [availableDurationOptions, duration, prefill?.booking, availabilityReady, hoursReady, isBulkEdit]);

  useEffect(() => {
    const r = rooms.find((x) => String(x.id) === String(roomId));
    const items = r?.borrowable_items || [];
    setBorrowableItems(items);
    if (prefill?.booking && String(prefill.booking.room_id) === String(roomId)) {
      setSelectedBorrowed((prev) => {
        const out: Record<string, boolean> = { ...(prev || {}) };
        items.forEach((it: string) => {
          if (!(it in out)) out[it] = false;
        });
        Object.keys(out).forEach((k) => {
          if (!items.includes(k)) delete out[k];
        });
        return out;
      });
      return;
    }
    const sel: Record<string, boolean> = {};
    items.forEach((it: string) => (sel[it] = false));
    setSelectedBorrowed(sel);
  }, [roomId, rooms, prefill?.booking]);

  const toggleBorrowed = (item: string) => {
    setSelectedBorrowed((s) => ({ ...s, [item]: !s[item] }));
  };

  const selectSmartRoom = (room: any, bookings = dayBookings) => {
    setRoomId(String(room.id));
    if (smartRequestedDuration.current) {
      const { minutesAvailable } = getRoomAvailability(room.id, bookings, roomRequest);
      setDuration(
        String(Math.min(Number(smartRequestedDuration.current), Math.floor(minutesAvailable / 30) * 30)),
      );
    }
  };

  const handleSmartSelect = async () => {
    if (!hoursReady) {
      showToast('Unavailable', 'Opening hours have not loaded. Please reopen the booking form.', 'info');
      return;
    }
    const sizeStr = window.prompt('Enter Group Size:');
    if (!sizeStr) return;
    const size = Number(sizeStr);
    if (!Number.isInteger(size) || size <= 0) {
      showToast('Invalid size', 'Please enter a positive whole number', 'error');
      return;
    }
    const requestId = ++smartRequestId.current;
    const { data: bookings, error } = await listAvailabilityBookings(startDate);
    if (requestId !== smartRequestId.current) return;
    if (error || !bookings) {
      showToast('Unavailable', 'Could not load availability data. Please try Smart Select again.', 'info');
      return;
    }
    setAvailability({ date: startDate, bookings });
    const ranked = rankRooms(size, rooms, bookings, {
      ...roomRequest,
      duration: duration ? Number(duration) : 30,
    });
    if (ranked.length === 0) {
      setIsSmartSelecting(false);
      setRankedRooms([]);
      showToast(
        'No rooms found',
        'No rooms fit this group with at least 30 minutes available within opening hours.',
        'info',
      );
      return;
    }
    setRankedRooms(ranked);
    setCurrentRankIndex(0);
    smartRequestedDuration.current = duration;
    selectSmartRoom(ranked[0], bookings);
    setIsSmartSelecting(true);
  };

  const selectNextRankedRoom = () => {
    if (rankedRooms.length === 0) return;
    const nextIndex = (currentRankIndex + 1) % rankedRooms.length;
    setCurrentRankIndex(nextIndex);
    selectSmartRoom(rankedRooms[nextIndex]);
  };
  return {
    helpId,
    confirm,
    currentTime,
    loading,
    setLoading,
    saveError,
    setSaveError,
    roomId,
    setRoomId,
    startDate,
    setStartDate,
    startClock,
    setStartClock,
    duration,
    setDuration,
    staffName,
    setStaffName,
    isNameManuallyTyped,
    setIsNameManuallyTyped,
    studentNumbers,
    setStudentNumbers,
    totalStudents,
    setTotalStudents,
    isBulkCount,
    selectedCourseId,
    setSelectedCourseId,
    otherCourseName,
    setOtherCourseName,
    selectedExtension,
    setSelectedExtension,
    selectedState,
    setSelectedState,
    borrowableItems,
    setBorrowableItems,
    selectedBorrowed,
    setSelectedBorrowed,
    availabilityReady,
    dayBookings,
    errors,
    setErrors,
    contentRef,
    clearFieldError,
    showFieldErrors,
    isBulkEdit,
    bulkGroupBookings,
    groupReady,
    isBulkBooking,
    setIsBulkBooking,
    bulkDates,
    setBulkDates,
    bulkTimes,
    setBulkTimes,
    bulkRoomIds,
    setBulkRoomIds,
    isSmartSelecting,
    setIsSmartSelecting,
    rankedRooms,
    setRankedRooms,
    currentRankIndex,
    setCurrentRankIndex,
    openingHours,
    hoursReady,
    smartRequestId,
    roomRequest,
    availableDurationOptions,
    availableExtensionOptions,
    toggleBorrowed,
    handleSmartSelect,
    selectNextRankedRoom,
  };
}
export type BookingDraft = ReturnType<typeof useBookingDraft>;
