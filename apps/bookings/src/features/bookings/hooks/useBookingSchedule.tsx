import {
  getBooking,
  getBookingHandover,
  deleteBooking,
  updateBooking,
  updateBookingGroupState,
} from '@/api/bookings';
import { getOperationHours } from '@/api/settings';
import { listCourseChoices } from '@/api/courses';
import { listBookableRooms } from '@/api/rooms';
import { useState, useEffect, useRef, SyntheticEvent, useCallback } from 'react';
import timeLib from '@/shared/lib/time';
import { TopToolbar } from '../components/TopToolbar';
import { useConfirm } from '../context/ConfirmDialogContext';
import { format, parseISO, differenceInMinutes, isSameDay } from 'date-fns';
import { useLayout } from '@/shared/context/LayoutContext';
import { logEvent } from '@/api/activity';

export function useBookingSchedule() {
  const { confirm } = useConfirm();

  const { setHeaderContent } = useLayout();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [currentUser, setCurrentUser] = useState<string>('');

  const [statusCounts, setStatusCounts] = useState<{ late: number; overdue: number }>({
    late: 0,
    overdue: 0,
  });

  const [initialSearchFilter, setInitialSearchFilter] = useState<'late' | 'overdue' | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (
    title: string,
    description: string,
    severity: 'success' | 'error' | 'info' = 'success',
  ) => {
    setSnackbarMessage(`${title}: ${description}`);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleStatusCountsChange = useCallback((late: number, overdue: number) => {
    setStatusCounts((prev) => {
      if (prev.late === late && prev.overdue === overdue) return prev;
      return { late, overdue };
    });
  }, []);

  const handleFilterClick = useCallback((filter: 'late' | 'overdue') => {
    setInitialSearchFilter(filter);
    setIsSearchOpen(true);
  }, []);

  const handleSnackbarClose = (_?: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const t = await timeLib.getTime();
        setSelectedDate(t);
      } catch (e) {}
    })();
  }, []);

  const [panelOpen, setPanelOpen] = useState(false);

  const [panelData, setPanelData] = useState<any>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

  const [refreshGridTrigger, setRefreshGridTrigger] = useState(0);

  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [creationStartTime, setCreationStartTime] = useState<number | null>(null);

  const [rooms, setRooms] = useState<any[]>([]);

  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: roomsData, error: roomsError }, { data: coursesData, error: coursesError }] =
          await Promise.all([listBookableRooms(), listCourseChoices()]);

        if (roomsError) throw roomsError;
        if (coursesError) throw coursesError;

        setRooms(
          (roomsData || [])
            .filter((r: any) => r.is_available !== false)
            .map((r: any) => ({ ...r, id: String(r.id) })),
        );
        setCourses(coursesData || []);
      } catch (error) {
        console.error('Failed to load initial data', error);
        showToast('Error', 'Failed to load rooms and courses. Please refresh.', 'error');
      }
    };
    fetchData();
  }, []);

  const handleBookingSelect = (id: string) => {
    setHighlightedBookingId(id);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedBookingId(null);
    }, 3000);
  };

  const handleBookClick = useCallback(async () => {
    const now = await timeLib.getTime();

    const { data: settings } = await getOperationHours();

    let openTime = '06:00';
    let closeTime = '21:00';

    if (settings?.value) {
      const val = settings.value as any;
      openTime = val.start ?? val.open ?? '06:00';
      closeTime = val.end ?? val.close ?? '21:00';
    }

    const [closeH, closeM] = closeTime.split(':').map(Number);
    const [openH, openM] = openTime.split(':').map(Number);

    const mins = now.getMinutes();
    const rem = mins % 30;
    // Normalize to the nearest 30-minute slot used by the schedule grid.
    if (rem < 15) now.setMinutes(mins - rem);
    else now.setMinutes(mins + (30 - rem));
    now.setSeconds(0, 0);

    const nowH = now.getHours();
    const nowM = now.getMinutes();

    if (
      nowH > closeH ||
      (nowH === closeH && nowM >= closeM) ||
      nowH < openH ||
      (nowH === openH && nowM < openM)
    ) {
      now.setHours(openH);
      now.setMinutes(openM);
    }

    // Keep the day the user is viewing; the clock supplies only the default time.
    const bookingStart = new Date(selectedDate);
    bookingStart.setHours(now.getHours(), now.getMinutes(), 0, 0);
    setPanelData({ timeSlot: bookingStart.toISOString() });
    setCreationStartTime(Date.now());
    setPanelOpen(true);
  }, [selectedDate]);

  const handleCellClick = (roomId: string, timeSlotIso: string) => {
    setPanelData({ roomId, timeSlot: timeSlotIso });
    setCreationStartTime(Date.now());
    setPanelOpen(true);
  };

  const handleBookingClick = (bookingId: string) => {
    (async () => {
      try {
        const { data, error } = await getBooking(bookingId);
        if (error) {
          console.error('Error fetching booking', error);
          showToast('Error', 'Could not load full booking details', 'error');
          setPanelData({ bookingId });
        } else {
          setPanelData({ booking: data });
        }
      } catch (e) {
        console.error('Failed to load booking', e);
        showToast('Error', 'Failed to load booking details', 'error');
        setPanelData({ bookingId });
      } finally {
        setPanelOpen(true);
      }
    })();
  };

  const handleQuickAction = async (
    bookingId: string,
    action: 'activate' | 'end',
    source?: 'quick' | 'double_tap',
  ) => {
    const logType = source === 'double_tap' ? 'double_tap' : 'quick';
    try {
      const { data: booking, error: fetchError } = await getBookingHandover(bookingId);

      if (fetchError || !booking) throw fetchError || new Error('Booking not found');

      const roomName = (booking as any).rooms?.name || `Room ${booking.room_id}`;
      const startTime = format(parseISO(`${booking.booking_day}T${booking.start_time}`), 'HH:mm');
      const endTime = format(parseISO(`${booking.booking_day}T${booking.end_time}`), 'HH:mm');

      const now = await timeLib.getTime();
      const m = now.getMinutes();
      const roundedM = Math.round(m / 30) * 30;
      now.setMinutes(roundedM);
      now.setSeconds(0);
      now.setMilliseconds(0);

      const bookingStart = parseISO(`${booking.booking_day}T${booking.start_time}`);
      const bookingEnd = parseISO(`${booking.booking_day}T${booking.end_time}`);

      const exactNow = await timeLib.getTime();

      if (action === 'activate') {
        const confirmed = await confirm({
          title: 'Start Booking',
          description: `Start ${startTime} - ${endTime} booking for ${roomName}?`,
          confirmText: 'Start',
          cancelText: 'Cancel',
        });
        if (!confirmed) return;
      } else if (action === 'end') {
        let warningMessage: string | undefined;

        if (now < bookingEnd) {
          if (now <= bookingStart) {
            warningMessage =
              'Booking has not started or has not been active long enough and will be permanently deleted.';
          } else {
            const newEndTime = format(now, 'HH:mm');
            warningMessage = `Booking is ending early and will be adjusted to ${startTime} - ${newEndTime}.`;
          }
        }

        const confirmed = await confirm({
          title: 'End Booking',
          description: `End booking ${startTime} - ${endTime} for ${roomName}?`,
          warning: warningMessage,
          confirmText: 'End',
          cancelText: 'Cancel',
        });
        if (!confirmed) return;
      }

      let scope = 'single';
      if (booking.bulk_booking_id) {
        // Bulk bookings require explicit scope selection.
        const result = await confirm({
          title: action === 'activate' ? 'Activate Booking' : 'End Booking',
          description: `This booking is part of a bulk group.`,
          cancelText: 'Cancel',
          actions: [
            {
              label: `${action === 'activate' ? 'Activate' : 'End'} This Only`,
              value: 'single',
              variant: 'outlined',
            },
            {
              label: `${action === 'activate' ? 'Activate' : 'End'} Entire Group`,
              value: 'group',
              variant: 'contained',
            },
          ],
        });
        if (!result) return;
        scope = result;
      }

      const newState = action === 'activate' ? 'Active' : 'Ended';

      if (action === 'end') {
        if (scope === 'single') {
          if (booking?.borrowed_items && booking.borrowed_items.length > 0) {
            const lowercasedItems = booking.borrowed_items.map((item: string) => item.toLowerCase());
            const itemsList = lowercasedItems.join(', ');
            const lastIndex = itemsList.lastIndexOf(', ');
            const formattedList =
              lastIndex !== -1
                ? itemsList.substring(0, lastIndex) + ' and ' + itemsList.substring(lastIndex + 2)
                : itemsList;

            const verb = lowercasedItems.length === 1 ? 'Is' : 'Are';
            const returned = await confirm({
              title: 'Confirm Return',
              description: `${verb} ${formattedList} returned?`,
              confirmText: 'Yes',
              cancelText: 'No',
            });
            if (!returned) return;
          }

          if (now < bookingEnd) {
            // End-before-start deletes; mid-session end truncates end_time.
            if (now <= bookingStart) {
              const { error } = await deleteBooking(bookingId);
              if (error) throw error;
              showToast('Deleted', 'Booking deleted (ended before start time)', 'info');
              return;
            } else {
              const newEndTime = format(now, 'HH:mm:ss');
              const { error } = await updateBooking(bookingId, { state: newState, end_time: newEndTime });
              if (error) throw error;

              await logEvent('state_change', {
                type: logType,
                state: 'active_to_ended',
                time: isSameDay(exactNow, bookingEnd) ? differenceInMinutes(exactNow, bookingEnd) : 1000,
              });

              showToast('Success', `Booking ended early at ${format(now, 'HH:mm')}`, 'success');
              return;
            }
          } else {
            const { error } = await updateBooking(bookingId, { state: newState });
            if (error) throw error;

            await logEvent('state_change', {
              type: logType,
              state: 'active_to_ended',
              time: isSameDay(exactNow, bookingEnd) ? differenceInMinutes(exactNow, bookingEnd) : 1000,
            });

            showToast('Success', 'Booking ended', 'success');
            return;
          }
        } else {
          // Group end only updates state, not individual timings.
          const { error } = await updateBookingGroupState(booking.bulk_booking_id, { state: newState });
          if (error) throw error;

          await logEvent('state_change', {
            type: logType,
            state: 'active_to_ended',
            time: isSameDay(exactNow, bookingEnd) ? differenceInMinutes(exactNow, bookingEnd) : 1000,
          });

          showToast('Success', `Group ended`, 'success');
          return;
        }
      }

      if (scope === 'group') {
        const { error } = await updateBookingGroupState(booking.bulk_booking_id, { state: newState });
        if (error) throw error;

        await logEvent('state_change', {
          type: logType,
          state: 'reserved_to_active',
          time: isSameDay(exactNow, bookingStart) ? differenceInMinutes(exactNow, bookingStart) : 1000,
        });

        showToast('Success', `Group ${newState.toLowerCase()}`, 'success');
      } else {
        const { error } = await updateBooking(bookingId, { state: newState });
        if (error) throw error;

        await logEvent('state_change', {
          type: logType,
          state: 'reserved_to_active',
          time: isSameDay(exactNow, bookingStart) ? differenceInMinutes(exactNow, bookingStart) : 1000,
        });
        showToast('Success', `Booking ${newState.toLowerCase()}`, 'success');
      }
    } catch (err: any) {
      console.error('Quick action failed', err);
      showToast('Error', 'Failed to update booking', 'error');
    }
  };

  useEffect(() => {
    setHeaderContent(
      <TopToolbar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onBookClick={handleBookClick}
        onSearchClick={() => {
          setInitialSearchFilter(null);
          setIsSearchOpen((prev) => !prev);
        }}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        lateCount={statusCounts.late}
        overdueCount={statusCounts.overdue}
        onFilterClick={handleFilterClick}
      />,
    );
    return () => setHeaderContent(null);
  }, [selectedDate, currentUser, setHeaderContent, handleBookClick, statusCounts, handleFilterClick]);
  return {
    selectedDate,
    currentUser,
    setCurrentUser,
    initialSearchFilter,
    setInitialSearchFilter,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showToast,
    handleStatusCountsChange,
    handleSnackbarClose,
    panelOpen,
    setPanelOpen,
    panelData,
    setPanelData,
    isSearchOpen,
    setIsSearchOpen,
    highlightedBookingId,
    refreshGridTrigger,
    setRefreshGridTrigger,
    creationStartTime,
    setCreationStartTime,
    rooms,
    courses,
    handleBookingSelect,
    handleCellClick,
    handleBookingClick,
    handleQuickAction,
  };
}
