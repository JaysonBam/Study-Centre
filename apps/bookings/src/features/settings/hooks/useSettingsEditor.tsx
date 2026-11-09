import {
  getRequiredOperationHours,
  getSaturdayHours,
  getRequiredTestingClock,
  saveOperationHours,
  saveSaturdayHours,
  saveTestingClock,
} from '@/api/settings';
import { listCourses, deleteCourses, updateCourse, createCourses } from '@/api/courses';
import { listRooms, deleteRooms, updateRoom, createRooms } from '@/api/rooms';
import { isBookingDate, isBookingTime } from '@/shared/lib/bookingEntry';
import { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { useLayout } from '@/shared/context/LayoutContext';
import { RoomRow, CourseRow } from '../model/settingsEditorModel';

export function useSettingsEditor() {
  const { setHeaderContent } = useLayout();

  const [savingAll, setSavingAll] = useState(false);

  const [loadingRooms, setLoadingRooms] = useState(false);

  const [loadingCourses, setLoadingCourses] = useState(false);

  const [rooms, setRooms] = useState<RoomRow[]>([]);

  const [courses, setCourses] = useState<CourseRow[]>([]);

  const [deletedRoomIds, setDeletedRoomIds] = useState<number[]>([]);

  const [deletedCourseIds, setDeletedCourseIds] = useState<number[]>([]);

  const [borrowableInputs, setBorrowableInputs] = useState<Record<number, string>>({});

  const [opStart, setOpStart] = useState('08:00');

  const [opEnd, setOpEnd] = useState('17:00');

  const [satEnabled, setSatEnabled] = useState(false);

  const [satStart, setSatStart] = useState('09:00');

  const [satEnd, setSatEnd] = useState('13:00');

  const [testingEnabled, setTestingEnabled] = useState(false);

  const [testingDate, setTestingDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [testingTime, setTestingTime] = useState(() => new Date().toTimeString().slice(0, 5));

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    {
      open: false,
      message: '',
      severity: 'success',
    },
  );

  useEffect(() => {
    setHeaderContent(
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
        System Settings
      </Typography>,
    );
    loadAll();
  }, [setHeaderContent]);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  async function loadAll() {
    await Promise.all([fetchRooms(), fetchCourses(), fetchSettings()]);
  }

  async function fetchRooms() {
    setLoadingRooms(true);
    const { data, error } = await listRooms();
    setLoadingRooms(false);
    if (error) {
      setSnackbar({ open: true, message: 'Failed to load rooms: ' + error.message, severity: 'error' });
      return;
    }
    const rows = ((data ?? []) as RoomRow[]).sort((a, b) => a.name.localeCompare(b.name));
    setRooms(rows);

    const borrowMap: Record<number, string> = {};
    rows.forEach((r) => {
      borrowMap[r.id] = (r.borrowable_items ?? []).join(', ');
    });
    setBorrowableInputs(borrowMap);
  }

  async function fetchCourses() {
    setLoadingCourses(true);
    const { data, error } = await listCourses();
    setLoadingCourses(false);
    if (error) {
      setSnackbar({ open: true, message: 'Failed to load courses: ' + error.message, severity: 'error' });
      return;
    }
    setCourses(((data ?? []) as CourseRow[]).sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function fetchSettings() {
    const { data: hoursData } = await getRequiredOperationHours();
    if (hoursData?.value) {
      const v = hoursData.value as any;
      if (v.start) setOpStart(v.start);
      if (v.end) setOpEnd(v.end);
    }

    const { data: satData } = await getSaturdayHours();
    if (satData?.value) {
      const v = satData.value as any;
      if (typeof v.enabled === 'boolean') setSatEnabled(!!v.enabled);
      if (v.start) setSatStart(v.start);
      if (v.end) setSatEnd(v.end);
    }

    const { data: testData } = await getRequiredTestingClock();
    if (testData?.value) {
      const v = testData.value as any;
      if (typeof v.enabled === 'boolean') setTestingEnabled(!!v.enabled);
      if (v.date) setTestingDate(v.date);
      if (v.time) setTestingTime(v.time);
    }
  }

  async function createCourse(name: string, color_hex?: string) {
    const tempId = -Date.now() - Math.floor(Math.random() * 1000);
    setCourses((s) => [...s, { id: tempId, name, color_hex: color_hex ?? null }]);
  }

  async function deleteCourse(id: number) {
    setCourses((s) => s.filter((c) => c.id !== id));
    if (id > 0) setDeletedCourseIds((s) => [...s, id]);
  }

  async function deleteRoom(id: number) {
    setRooms((s) => s.filter((r) => r.id !== id));
    setBorrowableInputs((s) => {
      const copy = { ...s };
      delete copy[id];
      return copy;
    });
    if (id > 0) setDeletedRoomIds((s) => [...s, id]);
  }

  function handleToggleRoomField(id: number, field: 'is_available', value: boolean) {
    setRooms((s) => s.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function createRoom(payload: {
    name: string;
    max_people?: number | null;
    min_people?: number | null;
    borrowable_items?: string[] | null;
    dynamic_labels?: string[] | null;
    is_available?: boolean | null;
  }) {
    const tempId = -Date.now() - Math.floor(Math.random() * 1000);
    const newRoom: RoomRow = {
      id: tempId,
      name: payload.name,
      max_people: payload.max_people ?? null,
      min_people: payload.min_people ?? null,
      borrowable_items: payload.borrowable_items ?? null,
      dynamic_labels: payload.dynamic_labels ?? null,
      is_available: payload.is_available ?? null,
    };
    setRooms((s) => [...s, newRoom]);
    setBorrowableInputs((s) => ({ ...s, [newRoom.id]: (newRoom.borrowable_items ?? []).join(', ') }));
  }

  async function saveAllRooms() {
    if (
      !isBookingTime(opStart) ||
      !isBookingTime(opEnd) ||
      opEnd <= opStart ||
      (satEnabled && (!isBookingTime(satStart) || !isBookingTime(satEnd) || satEnd <= satStart)) ||
      (testingEnabled && (!isBookingDate(testingDate) || !isBookingTime(testingTime)))
    ) {
      setSnackbar({
        open: true,
        message:
          'Check the date and times. Use DD/MM/YYYY and HH:mm; closing time must be after opening time.',
        severity: 'error',
      });
      return;
    }
    setSavingAll(true);
    try {
      if (deletedRoomIds.length) await deleteRooms(deletedRoomIds);
      if (deletedCourseIds.length) await deleteCourses(deletedCourseIds);

      const newRooms = rooms.filter((r) => r.id < 0);
      const existingRooms = rooms.filter((r) => r.id > 0);

      await Promise.all(
        existingRooms.map(async (row) => {
          const rawBorrow = borrowableInputs[row.id];
          const parsedBorrow =
            rawBorrow !== undefined
              ? rawBorrow
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : (row.borrowable_items ?? null);

          const payload: any = {
            name: row.name,
            max_people: row.max_people ?? null,
            min_people: row.min_people ?? null,
            borrowable_items: Array.isArray(parsedBorrow)
              ? parsedBorrow.length
                ? parsedBorrow
                : null
              : null,
            dynamic_labels: row.dynamic_labels ?? null,
            is_available: row.is_available ?? null,
          };
          await updateRoom(row.id, payload);
        }),
      );

      if (newRooms.length) {
        const insertPayloads = newRooms.map((row) => {
          const rawBorrow = borrowableInputs[row.id];
          const parsedBorrow =
            rawBorrow !== undefined
              ? rawBorrow
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : (row.borrowable_items ?? null);
          return {
            name: row.name,
            max_people: row.max_people ?? null,
            min_people: row.min_people ?? null,
            borrowable_items: Array.isArray(parsedBorrow)
              ? parsedBorrow.length
                ? parsedBorrow
                : null
              : null,
            dynamic_labels: row.dynamic_labels ?? null,
            is_available: row.is_available ?? null,
          };
        });
        await createRooms(insertPayloads);
      }

      const newCourses = courses.filter((c) => c.id < 0);
      const existingCourses = courses.filter((c) => c.id > 0);

      await Promise.all(
        existingCourses.map(async (course) => {
          await updateCourse(course.id, { name: course.name, color_hex: course.color_hex ?? null });
        }),
      );

      if (newCourses.length) {
        await createCourses(newCourses.map((c) => ({ name: c.name, color_hex: c.color_hex ?? null })));
      }

      const hoursPayload = { start: opStart, end: opEnd };
      await saveOperationHours({ key: 'operation_hours', value: hoursPayload });

      const satPayload = { enabled: satEnabled, start: satStart, end: satEnd };
      await saveSaturdayHours({ key: 'saturday_hours', value: satPayload });

      const testingPayload = { enabled: testingEnabled, date: testingDate, time: testingTime };
      await saveTestingClock({ key: 'testing_clock', value: testingPayload });

      await Promise.all([fetchRooms(), fetchCourses()]);
      setDeletedRoomIds([]);
      setDeletedCourseIds([]);
      setSnackbar({ open: true, message: 'All settings saved successfully', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Error saving settings: ' + err.message, severity: 'error' });
    } finally {
      setSavingAll(false);
    }
  }
  return {
    savingAll,
    loadingRooms,
    loadingCourses,
    rooms,
    setRooms,
    courses,
    setCourses,
    borrowableInputs,
    setBorrowableInputs,
    opStart,
    setOpStart,
    opEnd,
    setOpEnd,
    satEnabled,
    setSatEnabled,
    satStart,
    setSatStart,
    satEnd,
    setSatEnd,
    testingEnabled,
    setTestingEnabled,
    testingDate,
    setTestingDate,
    testingTime,
    setTestingTime,
    snackbar,
    handleCloseSnackbar,
    createCourse,
    deleteCourse,
    deleteRoom,
    handleToggleRoomField,
    createRoom,
    saveAllRooms,
  };
}
