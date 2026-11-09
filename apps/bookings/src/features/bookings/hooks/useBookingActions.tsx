import {
  getBookingGroup,
  listConflictSlots,
  endBookingGroup,
  createBookings,
  updateBookingGroup,
  deleteBookings,
  findEarlierBookings,
  endEarlierBookings,
  deleteBooking,
  updateBooking,
  createBooking,
  deleteBookingGroup,
} from '@/api/bookings';
import { useMemo } from 'react';
import { format, parseISO, addMinutes, eachDayOfInterval, differenceInMinutes, isSameDay } from 'date-fns';
import { getRoomAvailability, isReclaimableReservation } from '../model/roomRecommendations';
import timeLib from '@/shared/lib/time';
import {
  displayBookingDate,
  validateSchedule,
  validateBulkRanges,
  timeMinutes,
} from '@/shared/lib/bookingEntry';
import { logEvent } from '@/api/activity';
import type { BookingPanelProps } from '../types';
import type { BookingDraft } from './useBookingDraft';

export function useBookingActions(
  {
    onClose,
    prefill = null,
    defaultStaffName = '',
    showToast = () => {},
    onBookingUpdate,
    rooms,
    creationStartTime,
  }: BookingPanelProps,
  draft: BookingDraft,
) {
  const {
    confirm,
    currentTime,
    setLoading,
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
    studentNumbers,
    setStudentNumbers,
    totalStudents,
    isBulkCount,
    selectedCourseId,
    setSelectedCourseId,
    otherCourseName,
    setOtherCourseName,
    selectedExtension,
    setSelectedState,
    setBorrowableItems,
    selectedBorrowed,
    setSelectedBorrowed,
    availabilityReady,
    dayBookings,
    setErrors,
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
    setRankedRooms,
    currentRankIndex,
    setCurrentRankIndex,
    openingHours,
    hoursReady,
    roomRequest,
  } = draft;
  const mapDatabaseError = (error: any): string => {
    if (!error) return 'An unexpected error occurred';
    if (error.code === '23P01') return 'This time slot is already booked.';
    if (error.code === '23514') return 'Invalid booking time.';
    if (error.code === '23503') return 'Invalid room or course.';
    return error.message || 'Unable to complete the operation.';
  };

  const handleBulkGroupUpdate = async (state: 'Active' | 'Reserved' | 'Ended') => {
    if (!prefill?.booking?.bulk_booking_id) return;
    setLoading(true);
    try {
      const extensionMins = selectedExtension ? parseInt(selectedExtension, 10) : 0;

      const { data: group, error: groupError } = await getBookingGroup(prefill.booking.bulk_booking_id);
      if (groupError) throw groupError;
      if (!group?.length) throw new Error('This group no longer exists. Reopen the booking.');
      const { data: targetBookings, error: targetError } = await listConflictSlots(startDate);
      if (targetError) throw targetError;
      const groupIds = new Set(group.map((booking) => String(booking.id)));
      const groupRooms = new Set(group.map((booking) => String(booking.room_id)));
      const startMins = timeMinutes(startClock);
      const endMins = startMins + Number(duration) + extensionMins;
      if (endMins > timeMinutes(openingHours.end))
        throw new Error(`The booking must end by ${openingHours.end}.`);
      if (
        extensionMins &&
        (startDate !== prefill.booking.booking_day ||
          startClock !== prefill.booking.start_time.slice(0, 5) ||
          Number(duration) !==
            differenceInMinutes(
              parseISO(`${prefill.booking.booking_day}T${prefill.booking.end_time}`),
              parseISO(`${prefill.booking.booking_day}T${prefill.booking.start_time}`),
            ))
      ) {
        throw new Error('Save date or time changes before extending the group.');
      }
      const conflict = targetBookings?.find(
        (booking) =>
          !groupIds.has(String(booking.id)) &&
          groupRooms.has(String(booking.room_id)) &&
          startMins < timeMinutes(booking.end_time.slice(0, 5)) &&
          endMins > timeMinutes(booking.start_time.slice(0, 5)),
      );
      if (conflict) {
        const room = rooms.find((room) => String(room.id) === String(conflict.room_id));
        showFieldErrors({
          startClock: `${room?.name || 'A room in this group'} is already booked during this time. Choose another time.`,
        });
        return;
      }
      const basePayload: any = {
        booked_by: staffName,
      };

      let studentNumbersPayload = null; // Default to null if not set

      if (isBulkCount && totalStudents) {
        let uuid = prefill?.booking?.bulk_booking_id;
        if (uuid) {
          studentNumbersPayload = `bulk booking - ${uuid} - ${totalStudents}`;
        } else {
          studentNumbersPayload = studentNumbers;
        }
      } else if (isBulkCount && !totalStudents) {
        studentNumbersPayload = null;
      } else {
        studentNumbersPayload = studentNumbers;
      }

      if (isBulkCount) {
        basePayload.student_numbers = studentNumbersPayload;
      } else if (studentNumbers) {
        basePayload.student_numbers = studentNumbers;
      }

      if (selectedCourseId && selectedCourseId !== 'other') {
        basePayload.course_id = parseInt(selectedCourseId, 10);
        basePayload.course_name = null;
      } else if (selectedCourseId === 'other') {
        basePayload.course_id = null;
        basePayload.course_name = otherCourseName || null;
      } else {
        basePayload.course_id = null;
        basePayload.course_name = null;
      }

      if (extensionMins > 0) {
        // Extension ends the current group segment and creates a new active segment.
        const start = parseISO(`${startDate}T${startClock}`);
        const originalDuration = parseInt(duration, 10);
        const end = addMinutes(start, originalDuration);
        const extendedEnd = addMinutes(end, extensionMins);

        const newClumpId = crypto.randomUUID();

        const { error: updateError } = await endBookingGroup(prefill.booking.bulk_booking_id, {
          state: 'Ended',
          end_time: format(end, 'HH:mm:ss'), // Ensure they end at the proper time
        });

        if (updateError) throw updateError;

        const newBookings = group.map((b) => {
          let nextStudentNumbers = b.student_numbers;
          if (basePayload.student_numbers && basePayload.student_numbers.startsWith('bulk booking -')) {
            const parts = basePayload.student_numbers.split(' - ');
            if (parts.length === 3) {
              nextStudentNumbers = `bulk booking - ${newClumpId} - ${parts[2]}`;
            }
          } else if (b.student_numbers && b.student_numbers.startsWith('bulk booking -')) {
            const parts = b.student_numbers.split(' - ');
            if (parts.length === 3) {
              nextStudentNumbers = `bulk booking - ${newClumpId} - ${parts[2]}`;
            }
          }

          return {
            ...basePayload,
            room_id: b.room_id,
            booking_day: b.booking_day, // Assume extending on same day
            start_time: format(end, 'HH:mm:ss'),
            end_time: format(extendedEnd, 'HH:mm:ss'),
            state: 'Active',
            student_numbers: nextStudentNumbers,
            borrowed_items: b.borrowed_items, // Copy from previous
            bulk_booking_id: newClumpId,
          };
        });

        const { error: insertError } = await createBookings(newBookings);
        if (insertError) throw insertError;

        showToast('Extended Group', `Extended ${newBookings.length} bookings`, 'success');
      } else {
        const end = addMinutes(parseISO(`${startDate}T${startClock}`), Number(duration));
        const updatePayload = {
          ...basePayload,
          booking_day: startDate,
          start_time: `${startClock}:00`,
          end_time: format(end, 'HH:mm:ss'),
          state,
        };

        const { data: updated, error } = await updateBookingGroup(
          prefill.booking.bulk_booking_id,
          updatePayload,
        );
        if (error) throw error;
        if (!updated?.length) throw new Error('No bookings were updated. Reopen the group and try again.');
        showToast(
          'Updated Group',
          `Updated ${updated.length} bookings for ${displayBookingDate(startDate)}, ${startClock}–${format(end, 'HH:mm')}`,
          'success',
        );
      }

      resetFormToDefaults();
      onBookingUpdate?.(staffName !== prefill?.booking?.booked_by ? staffName : undefined);
      onClose();
    } catch (err: any) {
      setSaveError(mapDatabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const analyzeChanges = () => {
    if (!prefill?.booking) return { isSharedChange: false, isIndividualChange: false, isExtension: false };

    const currentStartClock = startClock;
    const currentDuration = duration;
    const originalStart = prefill.booking.start_time.slice(0, 5);
    const s = parseISO(`${prefill.booking.booking_day}T${prefill.booking.start_time}`);
    const e = parseISO(`${prefill.booking.booking_day}T${prefill.booking.end_time}`);
    const originalDur = Math.round((e.getTime() - s.getTime()) / 60000);

    const isTimeChanged =
      startDate !== prefill.booking.booking_day ||
      currentStartClock !== originalStart ||
      parseInt(currentDuration) !== originalDur;

    const originalCourseId = prefill.booking.course_id ? String(prefill.booking.course_id) : '';
    const originalCourseName = prefill.booking.course_name ? prefill.booking.course_name : '';

    let isCourseChanged = false;
    if (selectedCourseId !== 'other') {
      isCourseChanged = selectedCourseId !== originalCourseId;
    } else {
      isCourseChanged = otherCourseName !== originalCourseName;
    }

    let isCountChanged = false;
    if (isBulkCount) {
      const raw = prefill.booking.student_numbers || '';
      const match = raw.match(/^bulk booking - [0-9a-fA-F-]+ - (\d+)$/);
      const originalCount = match ? match[1] : '';
      isCountChanged = totalStudents !== originalCount;
    }

    const isSharedChange = isTimeChanged || isCourseChanged || isCountChanged;

    const isRoomChanged = prefill.booking.room_id !== parseInt(roomId, 10);

    const isExtension = !!selectedExtension;

    return { isSharedChange, isIndividualChange: isRoomChanged, isExtension };
  };

  const validateDetails = () => {
    const next = validateSchedule(startDate, startClock, duration, openingHours);
    if (!roomId) next.roomId = 'Select a room.';
    if (!staffName.trim()) next.staffName = 'Enter the staff name.';
    if (!selectedCourseId) next.selectedCourseId = 'Select a course.';
    if (selectedCourseId === 'other' && !otherCourseName.trim())
      next.otherCourseName = 'Enter a course name.';
    if (isBulkCount && totalStudents && (!/^\d+$/.test(totalStudents) || Number(totalStudents) <= 0))
      next.totalStudents = 'Enter a positive whole number.';
    showFieldErrors(next);
    if (Object.keys(next).length) return false;
    if (!hoursReady) {
      setSaveError('Opening hours have not loaded. Reopen the form and try again.');
      return false;
    }
    return true;
  };

  const handleSave = async (state: 'Active' | 'Reserved' | 'Ended') => {
    setSaveError('');
    if (isBulkBooking) {
      await handleBulkSave(state);
      return;
    }

    if (!validateDetails()) return;
    if (isBulkEdit && !groupReady) {
      setSaveError('The bulk group has not loaded. Reopen the booking to try again.');
      return;
    }
    let updateScope = 'single';
    if (isBulkEdit) {
      const { isSharedChange, isIndividualChange, isExtension } = analyzeChanges();

      if (isSharedChange && isIndividualChange) {
        showToast(
          'Conflict',
          'Cannot change Room (Individual) and Time/Course/Count (Group) at the same time.',
          'error',
        );
        return;
      }

      const actions: any[] = [];

      if (isIndividualChange) {
        actions.push({ label: 'Update This Only', value: 'single', variant: 'contained' });
      } else if (isSharedChange) {
        actions.push({ label: 'Update Entire Group', value: 'group', variant: 'contained' });
      } else if (isExtension) {
        actions.push({ label: 'Extend This Only', value: 'single', variant: 'outlined' });
        actions.push({ label: 'Extend Entire Group', value: 'group', variant: 'contained' });
      } else {
        actions.push({ label: 'Update This Only', value: 'single', variant: 'outlined' });
        actions.push({ label: 'Update Entire Group', value: 'group', variant: 'contained' });
      }

      const result = await confirm({
        title: isExtension ? 'Extend Bulk Group' : 'Update Bulk Group',
        description: isSharedChange
          ? `Changes to date, time, course, or student count apply to all ${bulkGroupBookings.length} bookings. New schedule: ${displayBookingDate(startDate)}, ${startClock}–${format(addMinutes(parseISO(`${startDate}T${startClock}`), Number(duration)), 'HH:mm')}.`
          : isIndividualChange
            ? 'Room changes can only represent this individual booking.'
            : `This booking is part of a bulk group (${bulkGroupBookings.length} bookings).`,
        cancelText: 'Cancel',
        actions: actions,
      });
      if (!result) return;
      updateScope = result;
    }

    if (updateScope === 'group') {
      const { isIndividualChange } = analyzeChanges();
      if (isIndividualChange) {
        showToast('Error', 'Cannot apply room change to entire group.', 'error');
        return;
      }
      await handleBulkGroupUpdate(state);
      return;
    }

    const dur = Number(duration);
    const parseTime = (time: string) => timeMinutes(time.slice(0, 5));
    const bookingStartMins = parseTime(startClock);
    const bookingEndMins = bookingStartMins + dur;
    if (!availabilityReady) {
      showToast('Unavailable', 'Availability has not loaded for this date. Please try again.', 'info');
      return;
    }
    const bookingsToDelete: string[] = [];
    if (!isBulkBooking) {
      const hasCollision = dayBookings.some((b) => {
        if (String(b.room_id) !== String(roomId)) return false;
        if (prefill?.booking && String(b.id) === String(prefill.booking.id)) return false;

        const bStart = parseTime(b.start_time);
        const bEnd = parseTime(b.end_time);

        const overlaps = bookingStartMins < bEnd && bookingEndMins > bStart;

        if (overlaps) {
          if (isReclaimableReservation(b, roomRequest)) {
            // Late bookings can be auto-removed to free this overlapping slot.
            if (!bookingsToDelete.includes(String(b.id))) {
              bookingsToDelete.push(String(b.id));
            }
            return false;
          }
          return true; // Hard collision
        }
        return false;
      });

      if (hasCollision) {
        showToast('Unavailable', 'This time slot is already booked.', 'error');
        return;
      }

      if (bookingsToDelete.length > 0) {
        const ok = await confirm({
          title: 'Overwrite Late Booking?',
          description: 'This room will delete the late booking. Do you wanna proceed?',
          confirmText: 'Yes',
          cancelText: 'No',
        });
        if (!ok) return;

        setLoading(true);
        const { error } = await deleteBookings(bookingsToDelete);
        if (error) {
          console.error(error);
          showToast('Error', 'Failed to delete overlapping booking', 'error');
          setLoading(false);
          return;
        }
      }
    }

    const borrowed = Object.keys(selectedBorrowed).filter((k) => selectedBorrowed[k]);

    if (state === 'Ended' && borrowed.length > 0) {
      const lowercasedItems = borrowed.map((item) => item.toLowerCase());
      const itemsList = lowercasedItems.join(', ');
      const returned = await confirm({
        title: 'Confirm Return',
        description: `Are ${itemsList} returned?`,
        confirmText: 'Yes',
        cancelText: 'No',
      });
      if (!returned) return;
    }

    setLoading(true);
    try {
      const start = parseISO(`${startDate}T${startClock}`);

      if (state === 'Active') {
        const startStr = format(start, 'HH:mm:ss');

        const { data: autoEndedBookings } = await findEarlierBookings(startStr, startDate, roomId);

        if (autoEndedBookings && autoEndedBookings.length > 0) {
          const exactNow = await timeLib.getTime();
          for (const b of autoEndedBookings) {
            const bEnd = parseISO(`${startDate}T${b.end_time}`);
            const diffMins = isSameDay(exactNow, bEnd) ? differenceInMinutes(exactNow, bEnd) : 1000;
            await logEvent('state_change', {
              type: 'auto',
              state: 'active_to_ended',
              time: diffMins,
            });
          }
        }

        const { error: _autoEndError } = await endEarlierBookings(startStr, startDate, roomId, {
          state: 'Ended',
        });

        if (_autoEndError) {
          showToast('Error', 'Failed to auto-end overlapping bookings', 'error');
        }
      }

      const extensionMins = selectedExtension ? parseInt(selectedExtension, 10) : 0;

      const originalDuration = parseInt(duration, 10);
      let end = addMinutes(start, originalDuration);

      let extendedEnd = addMinutes(end, extensionMins);

      if (state === 'Ended' && extensionMins === 0) {
        const now = await timeLib.getTime();
        const m = now.getMinutes();
        const roundedM = Math.round(m / 30) * 30;
        now.setMinutes(roundedM);
        now.setSeconds(0);
        now.setMilliseconds(0);

        if (now < end) {
          if (now <= start) {
            if (prefill?.booking) {
              const { error } = await deleteBooking(prefill.booking.id);
              if (error) throw error;
              showToast('Deleted', 'Booking deleted.', 'info');
            } else {
              showToast('Not Saved', 'Booking would end before start time.', 'info');
            }
            resetFormToDefaults();
            onBookingUpdate?.();
            onClose();
            setLoading(false);
            return;
          } else {
            end = now;
          }
        }
      } else if (!prefill?.booking && extensionMins > 0) {
        end = extendedEnd;
      } else if (prefill?.booking && extensionMins === 0) {
      }

      const booking_day = startDate;

      const basePayload: any = {
        room_id: parseInt(roomId, 10),
        booking_day,
        student_numbers: studentNumbers || null,
        borrowed_items: borrowed,
        booked_by: staffName,
      };

      if (selectedCourseId && selectedCourseId !== 'other') {
        basePayload.course_id = parseInt(selectedCourseId, 10);
        basePayload.course_name = null;
      } else if (selectedCourseId === 'other') {
        basePayload.course_id = null;
        basePayload.course_name = otherCourseName || null;
      } else {
        basePayload.course_id = null;
        basePayload.course_name = null;
      }

      if (prefill?.booking) {
        if (extensionMins > 0) {
          // Split existing booking into an ended segment plus a new active extension.
          const oldPayload = {
            ...basePayload,
            start_time: format(start, 'HH:mm:ss'),
            end_time: format(end, 'HH:mm:ss'),
            state: 'Ended',
          };

          const { error: updateError } = await updateBooking(prefill.booking.id, oldPayload);
          if (updateError) throw updateError;

          const exactNow = await timeLib.getTime();
          const bEnd = end;
          await logEvent('state_change', {
            type: 'extended',
            state: 'active_to_ended',
            time: isSameDay(exactNow, bEnd) ? differenceInMinutes(exactNow, bEnd) : 1000,
          });

          const newPayload = {
            ...basePayload,
            start_time: format(end, 'HH:mm:ss'),
            end_time: format(extendedEnd, 'HH:mm:ss'),
            state: 'Active',
          };

          const { error: insertError } = await createBooking(newPayload);
          if (insertError) throw insertError;

          await logEvent('booking_create', {
            type: 'extension',
            rank: null,
            name_entered: isNameManuallyTyped ? 'manual' : 'auto',
            state: 'active',
            time: creationStartTime ? (Date.now() - creationStartTime) / 1000 : 0,
          });

          showToast('Extended', 'Booking extended (new session created)', 'success');
        } else {
          const payload = {
            ...basePayload,
            start_time: format(start, 'HH:mm:ss'),
            end_time: format(end, 'HH:mm:ss'),
            state,
          };
          const { error } = await updateBooking(prefill.booking.id, payload);
          if (error) throw error;

          if (state !== prefill.booking.state) {
            const exactNow = await timeLib.getTime();
            let timeDiff = 0;
            let targetState: 'reserved_to_active' | 'active_to_ended' | null = null;

            if (prefill.booking.state === 'Reserved' && state === 'Active') {
              const bStart = parseISO(`${prefill.booking.booking_day}T${prefill.booking.start_time}`);
              timeDiff = isSameDay(exactNow, bStart) ? differenceInMinutes(exactNow, bStart) : 1000;
              targetState = 'reserved_to_active';
            } else if (prefill.booking.state === 'Active' && state === 'Ended') {
              const bEnd = parseISO(`${prefill.booking.booking_day}T${prefill.booking.end_time}`);
              timeDiff = isSameDay(exactNow, bEnd) ? differenceInMinutes(exactNow, bEnd) : 1000;
              targetState = 'active_to_ended';
            }

            if (targetState) {
              await logEvent('state_change', {
                type: 'manual',
                state: targetState,
                time: timeDiff,
              });
            }
          }

          showToast('Updated', 'Booking updated', 'success');
        }
      } else {
        const payload = {
          ...basePayload,
          start_time: format(start, 'HH:mm:ss'),
          end_time: format(end, 'HH:mm:ss'),
          state,
        };
        const { error } = await createBooking(payload);
        if (error) throw error;

        await logEvent('booking_create', {
          type: isSmartSelecting ? 'smart' : 'manual',
          rank: isSmartSelecting ? currentRankIndex + 1 : null,
          name_entered: isNameManuallyTyped ? 'manual' : 'auto',
          state: (state as string).toLowerCase() as any,
          time: creationStartTime ? (Date.now() - creationStartTime) / 1000 : 0,
        });

        showToast('Saved', 'Booking created', 'success');
      }
      resetFormToDefaults();
      onBookingUpdate?.(staffName !== prefill?.booking?.booked_by ? staffName : undefined);
      onClose();
    } catch (err: any) {
      setSaveError(mapDatabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const addBulkDate = () =>
    setBulkDates((previous) => [...previous, { id: crypto.randomUUID(), start: '', end: '' }]);

  const addBulkTime = () =>
    setBulkTimes((previous) => [...previous, { id: crypto.randomUUID(), start: '', end: '' }]);

  const updateBulkDate = (id: string, field: 'start' | 'end', value: string) =>
    setBulkDates((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const updateBulkTime = (id: string, field: 'start' | 'end', value: string) =>
    setBulkTimes((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const removeRange = (kind: 'date' | 'time', id: string, index: number) => {
    const rows = kind === 'date' ? bulkDates : bulkTimes;
    const next = rows.filter((row) => row.id !== id);
    (kind === 'date' ? setBulkDates : setBulkTimes)(next);
    const focusId = next[Math.min(index, next.length - 1)]?.id;
    requestAnimationFrame(() =>
      document.getElementById(focusId ? `${focusId}-start` : `add-${kind}-range`)?.focus(),
    );
  };

  const rangeErrors = validateBulkRanges(bulkDates, bulkTimes, openingHours);

  const toggleBulkRoom = (rId: string) => {
    clearFieldError('bulkRooms');
    setBulkRoomIds((prev) => (prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]));
  };

  const handleBulkSave = async (state: 'Active' | 'Reserved' | 'Ended') => {
    const newErrors = validateBulkRanges(bulkDates, bulkTimes, openingHours);
    if (!bulkDates.length) newErrors.bulkDates = 'Add at least one date range.';
    if (!bulkTimes.length) newErrors.bulkTimes = 'Add at least one time range.';
    if (!bulkRoomIds.length) newErrors.bulkRooms = 'Select at least one room.';
    if (!staffName.trim()) newErrors.staffName = 'Enter the staff name.';
    if (!selectedCourseId) newErrors.selectedCourseId = 'Select a course.';
    if (selectedCourseId === 'other' && !otherCourseName.trim())
      newErrors.otherCourseName = 'Enter a course name.';
    showFieldErrors(newErrors);
    if (Object.keys(newErrors).length) {
      showToast('Check the form', 'Correct the highlighted fields. Every range must be complete.', 'error');
      return;
    }
    if (!hoursReady) {
      setSaveError('Opening hours have not loaded. Reopen the form and try again.');
      return;
    }

    setLoading(true);
    try {
      const bookingsToInsert: any[] = [];
      for (const dateRange of bulkDates) {
        const startD = parseISO(dateRange.start);
        const endD = parseISO(dateRange.end);
        const days = eachDayOfInterval({ start: startD, end: endD });
        for (const day of days) {
          const dayStr = format(day, 'yyyy-MM-dd');
          for (const timeRange of bulkTimes) {
            const tStart = timeRange.start;
            const tEnd = timeRange.end;

            const clumpId = crypto.randomUUID();

            for (const rId of bulkRoomIds) {
              const payload: any = {
                room_id: parseInt(rId, 10),
                start_time: tStart + ':00',
                end_time: tEnd + ':00',
                booking_day: dayStr,
                student_numbers: null,
                borrowed_items: [],
                booked_by: staffName,
                state: state,
                bulk_booking_id: clumpId,
              };
              if (selectedCourseId && selectedCourseId !== 'other') {
                payload.course_id = parseInt(selectedCourseId, 10);
                payload.course_name = null;
              } else if (selectedCourseId === 'other') {
                payload.course_id = null;
                payload.course_name = otherCourseName || null;
              } else {
                payload.course_id = null;
                payload.course_name = null;
              }
              bookingsToInsert.push(payload);
            }
          }
        }
      }
      if (bookingsToInsert.length === 0) {
        showToast('No bookings', 'Check ranges', 'info');
        return;
      }
      const { error } = await createBookings(bookingsToInsert);
      if (error) throw error;
      showToast('Saved', `${bookingsToInsert.length} bookings created`, 'success');
      resetFormToDefaults();
      onBookingUpdate?.(staffName !== prefill?.booking?.booked_by ? staffName : undefined);
      onClose();
    } catch (err: any) {
      console.error(err);
      setSaveError(mapDatabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetFormToDefaults = () => {
    setRoomId('');
    setStartDate(() => format(new Date(), 'yyyy-MM-dd'));
    const nowInit = new Date();
    nowInit.setMinutes(Math.round(nowInit.getMinutes() / 30) * 30);
    setStartClock(format(nowInit, 'HH:mm'));
    setDuration('30');
    setStaffName(defaultStaffName);
    setStudentNumbers('');
    setSelectedCourseId('');
    setOtherCourseName('');
    setSelectedBorrowed({});
    setBorrowableItems([]);
    setSelectedState('Active');
    setIsBulkBooking(false);
    setBulkDates([{ id: crypto.randomUUID(), start: '', end: '' }]);
    setBulkTimes([{ id: crypto.randomUUID(), start: '', end: '' }]);
    setBulkRoomIds([]);
    setIsSmartSelecting(false);
    setRankedRooms([]);
    setCurrentRankIndex(0);
    setErrors({});
    setSaveError('');
  };

  const handleDelete = async () => {
    if (!prefill?.booking?.id) return;
    const isGroup = isBulkEdit && prefill.booking.bulk_booking_id;

    let scope = 'single';
    if (isGroup) {
      const result = await confirm({
        title: 'Delete Booking',
        description: `This booking is part of a bulk group (${bulkGroupBookings.length} bookings).`,
        cancelText: 'Cancel',
        actions: [
          { label: 'Delete This Only', value: 'single', variant: 'outlined', color: 'error' },
          { label: 'Delete Entire Group', value: 'group', variant: 'contained', color: 'error' },
        ],
      });
      if (!result) return;
      scope = result;
    } else {
      const ok = await confirm({
        title: 'Delete Booking',
        description: 'Delete this booking?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });
      if (!ok) return;
    }

    setLoading(true);
    try {
      if (scope === 'group') {
        const { error } = await deleteBookingGroup(prefill.booking.bulk_booking_id);
        if (error) throw error;
      } else {
        const { error } = await deleteBooking(prefill.booking.id);
        if (error) throw error;
      }
      showToast('Deleted', 'Booking deleted', 'info');
      onBookingUpdate?.();
      onClose();
    } catch (err: any) {
      showToast('Delete failed', err?.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoomStatus = (rId: string) => {
    if (!availabilityReady || !hoursReady || !startClock || !startDate) return null;
    const status = getRoomAvailability(rId, dayBookings, roomRequest);
    const describe = (minutes: number) =>
      minutes < 60 ? minutes + ' minutes' : Math.floor(minutes / 60) + ' hr+';
    if (status.occupied)
      return {
        color: status.reserved ? 'warning.light' : 'error.main',
        text: status.reserved ? 'Reserved' : 'Occupied',
      };
    if (status.minutesAvailable === 0) return { color: 'text.secondary', text: 'Outside opening hours' };
    if (status.lateMinutes) return { color: 'warning.main', text: describe(status.lateMinutes) + ' late' };
    if (status.overdueMinutes)
      return { color: 'error.main', text: 'Overdue ' + describe(status.overdueMinutes) };
    if (status.minutesAvailable <= 120) {
      const h = Math.floor(status.minutesAvailable / 60);
      const m = status.minutesAvailable % 60;
      return {
        color: 'text.primary',
        text: 'Available for ' + (h ? h + ' hr' : '') + (h && m ? ' ' : '') + (m ? m + ' min' : ''),
      };
    }
    return null;
  };

  const shouldHighlightReserve = useMemo(() => {
    if (!startDate || !startClock) return false;
    try {
      const selectedTime = parseISO(`${startDate}T${startClock}`);
      const roundedCurrent = new Date(currentTime);
      roundedCurrent.setMinutes(Math.round(roundedCurrent.getMinutes() / 30) * 30);
      roundedCurrent.setSeconds(0);
      return roundedCurrent < selectedTime;
    } catch (e) {
      return false;
    }
  }, [currentTime, startDate, startClock]);

  const helpDescription =
    'Dates use day/month/year (DD/MM/YYYY), for example 16/12/2026. Times use 24-hour HH:mm in 30-minute intervals, for example 08:00 or 08:30.' +
    (isBulkBooking
      ? ' Date ranges include both the first and last day. Each time range applies to every selected day and room.'
      : '');
  return {
    handleSave,
    addBulkDate,
    addBulkTime,
    updateBulkDate,
    updateBulkTime,
    removeRange,
    rangeErrors,
    toggleBulkRoom,
    handleDelete,
    getRoomStatus,
    shouldHighlightReserve,
    helpDescription,
  };
}
