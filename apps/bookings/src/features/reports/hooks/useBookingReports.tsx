import { listCourseNames } from '@/api/courses';
import { listRoomNames } from '@/api/rooms';
import { getBookingReportPage } from '@/api/reports';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Typography } from '@mui/material';
import { useLayout } from '@/shared/context/LayoutContext';
import { format, parse, differenceInMinutes } from 'date-fns';

export function useBookingReports() {
  const { setHeaderContent } = useLayout();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

  const [loading, setLoading] = useState(false);

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
        Analytics & Reports
      </Typography>,
    );
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleGenerateReports = async () => {
    if (!selectedMonth) {
      showMessage('Please select a month first.', 'error');
      return;
    }

    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${selectedMonth}-01`;
      const endD = new Date(parseInt(year), parseInt(month), 0);
      const endDate = format(endD, 'yyyy-MM-dd');

      let allBookings: any[] = [];
      let from = 0;
      let to = 999;
      let hasMore = true;

      while (hasMore) {
        // Page through bookings to avoid large one-shot reads.
        const { data: bookings, error: bookingsError } = await getBookingReportPage(
          from,
          to,
          endDate,
          startDate,
        );

        if (bookingsError) throw bookingsError;

        if (bookings && bookings.length > 0) {
          allBookings = [...allBookings, ...bookings];
          if (bookings.length < 1000 || allBookings.length >= 4000) {
            hasMore = false;
          } else {
            from += 1000;
            to += 1000;
          }
        } else {
          hasMore = false;
        }
      }
      const bookings = allBookings;

      if (bookings.length === 0) {
        showMessage('No bookings found for the selected month.', 'error');
        setLoading(false);
        return;
      }

      const { data: rooms, error: roomsError } = await listRoomNames();

      if (roomsError) throw roomsError;

      const { data: courses, error: coursesError } = await listCourseNames();

      if (coursesError) throw coursesError;

      const roomMap = new Map(rooms?.map((r) => [r.id, r.name]));
      const courseMap = new Map(courses?.map((c) => [c.id, c.name]));

      const calculateDuration = (start: string, end: string) => {
        const s = parse(start, 'HH:mm:ss', new Date());
        const e = parse(end, 'HH:mm:ss', new Date());
        return differenceInMinutes(e, s) / 60;
      };

      const sanitizeExcel = (str: string) => {
        if (!str) return '';
        return str.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
      };

      const groupedBookings = new Map<string, any[]>();

      bookings?.forEach((booking) => {
        // Merge multi-room records that belong to the same bulk timeslot.
        const key = booking.bulk_booking_id
          ? `${booking.bulk_booking_id}_${booking.booking_day}_${booking.start_time}`
          : booking.id;

        if (!groupedBookings.has(key)) {
          groupedBookings.set(key, []);
        }
        groupedBookings.get(key)?.push(booking);
      });

      const rawData = Array.from(groupedBookings.values()).map((group) => {
        const mainBooking = group[0];
        const roomNames = group
          .map((b: any) => roomMap.get(b.room_id) || `Room ${b.room_id}`)
          .sort()
          .join(', ');

        const courseName =
          mainBooking.course_name ||
          (mainBooking.course_id ? courseMap.get(mainBooking.course_id) : 'N/A') ||
          'N/A';

        const duration = calculateDuration(mainBooking.start_time, mainBooking.end_time);

        let studentCount = 0;
        const bulkMatch = mainBooking.student_numbers?.match(/^bulk booking - [0-9a-fA-F-]+ - (\d+)$/);

        if (bulkMatch && mainBooking.bulk_booking_id) {
          studentCount = parseInt(bulkMatch[1], 10);
        } else {
          const sn = mainBooking.student_numbers || '';
          if (!sn.startsWith('bulk booking -')) {
            studentCount = sn.split('\n').filter((l: string) => l.trim()).length;
          }
        }

        const [y, m, d] = (mainBooking.booking_day || '').split('-').map((n: string) => parseInt(n, 10));
        const bookingDate = y && m && d ? new Date(y, m - 1, d) : new Date(0);

        const timeToFraction = (timeStr: string) => {
          if (!timeStr) return 0;
          const parts = timeStr.split(':').map((n: string) => parseInt(n, 10));
          const seconds = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
          // Excel stores time as a fraction of a day.
          return seconds / 86400; // 86400 seconds in a day
        };
        const startTime = timeToFraction(mainBooking.start_time);
        const endTime = timeToFraction(mainBooking.end_time);

        return {
          Date: bookingDate,
          Room: sanitizeExcel(roomNames),
          Course: sanitizeExcel(courseName),
          'Start Time': startTime,
          'End Time': endTime,
          'Duration (Hours)': Number(duration.toFixed(2)),
          'Booked By': sanitizeExcel(mainBooking.booked_by),
          'Student Numbers': mainBooking.bulk_booking_id ? '' : sanitizeExcel(mainBooking.student_numbers),
          'Student Count': studentCount,
        };
      });

      rawData.sort((a, b) => {
        const dateCompare = a.Date.getTime() - b.Date.getTime();
        if (dateCompare !== 0) return dateCompare;

        const roomCompare = a.Room.localeCompare(b.Room);
        if (roomCompare !== 0) return roomCompare;

        return a['Start Time'] - b['Start Time'];
      });

      const roomStats: Record<string, { bookings: number; hours: number }> = {};

      rooms?.forEach((room) => {
        roomStats[room.name] = { bookings: 0, hours: 0 };
      });

      bookings?.forEach((booking) => {
        const roomName = roomMap.get(booking.room_id);
        if (roomName) {
          const duration = calculateDuration(booking.start_time, booking.end_time);
          roomStats[roomName].bookings += 1;
          roomStats[roomName].hours += duration;
        }
      });

      const roomReport = Object.entries(roomStats)
        .map(([room, stats]) => ({
          Room: sanitizeExcel(room),
          'Total Bookings': stats.bookings,
          'Total Hours': Number(stats.hours.toFixed(2)),
        }))
        .sort((a, b) => a.Room.localeCompare(b.Room));

      const courseStats: Record<string, { bookings: number; hours: number }> = {};

      courses?.forEach((course) => {
        courseStats[course.name] = { bookings: 0, hours: 0 };
      });

      bookings?.forEach((booking) => {
        const courseName =
          booking.course_name || (booking.course_id ? courseMap.get(booking.course_id) : null);

        if (courseName) {
          if (!courseStats[courseName]) {
            courseStats[courseName] = { bookings: 0, hours: 0 };
          }
          const duration = calculateDuration(booking.start_time, booking.end_time);
          courseStats[courseName].bookings += 1;
          courseStats[courseName].hours += duration;
        }
      });

      const courseReport = Object.entries(courseStats)
        .map(([course, stats]) => ({
          Course: sanitizeExcel(course),
          'Total Bookings': stats.bookings,
          'Total Hours': Number(stats.hours.toFixed(2)),
        }))
        .sort((a, b) => a.Course.localeCompare(b.Course));

      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.json_to_sheet(rawData || [], { cellDates: true });

      if (ws1['!ref']) {
        const range = XLSX.utils.decode_range(ws1['!ref']);
        // Force explicit Excel cell formats to prevent auto-coercion.
        const timeFmt = XLSX.SSF.get_table()[20] || 'h:mm'; // Use 24-hour Time format (ID 20)

        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const dateCell = ws1[XLSX.utils.encode_cell({ r: R, c: 0 })];
          if (dateCell) {
            dateCell.t = 'd';
            dateCell.z = 'dd/mm/yyyy';
          }

          const roomCell = ws1[XLSX.utils.encode_cell({ r: R, c: 1 })];
          if (roomCell) {
            roomCell.t = 's';
            roomCell.z = '@';
          }

          const courseCell = ws1[XLSX.utils.encode_cell({ r: R, c: 2 })];
          if (courseCell) {
            courseCell.t = 's';
            courseCell.z = '@';
          }

          const startCell = ws1[XLSX.utils.encode_cell({ r: R, c: 3 })];
          if (startCell) {
            startCell.t = 'n';
            startCell.z = timeFmt;
          }

          const endCell = ws1[XLSX.utils.encode_cell({ r: R, c: 4 })];
          if (endCell) {
            endCell.t = 'n';
            endCell.z = timeFmt;
          }

          const durCell = ws1[XLSX.utils.encode_cell({ r: R, c: 5 })];
          if (durCell) {
            durCell.t = 'n';
            durCell.z = '0.00';
          }

          const bookedByCell = ws1[XLSX.utils.encode_cell({ r: R, c: 6 })];
          if (bookedByCell) {
            bookedByCell.t = 's';
            bookedByCell.z = '@';
          }

          const studNumCell = ws1[XLSX.utils.encode_cell({ r: R, c: 7 })];
          if (studNumCell) {
            studNumCell.t = 's';
            studNumCell.z = '@';
          }

          const studCountCell = ws1[XLSX.utils.encode_cell({ r: R, c: 8 })];
          if (studCountCell) {
            studCountCell.t = 'n';
            studCountCell.z = '0';
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws1, 'Raw Data');

      const formatStatSheet = (ws: XLSX.WorkSheet) => {
        if (!ws['!ref']) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const labelCell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
          if (labelCell) {
            labelCell.t = 's';
            labelCell.z = '@';
          }

          const countCell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
          if (countCell) {
            countCell.t = 'n';
            countCell.z = '0';
          }

          const hourCell = ws[XLSX.utils.encode_cell({ r: R, c: 2 })];
          if (hourCell) {
            hourCell.t = 'n';
            hourCell.z = '0.00';
          }
        }
      };

      const ws2 = XLSX.utils.json_to_sheet(roomReport);
      formatStatSheet(ws2);
      XLSX.utils.book_append_sheet(wb, ws2, 'Room Stats');

      const ws3 = XLSX.utils.json_to_sheet(courseReport);
      formatStatSheet(ws3);
      XLSX.utils.book_append_sheet(wb, ws3, 'Course Stats');

      const setColWidth = (ws: XLSX.WorkSheet, data: any[]) => {
        if (data.length === 0) return;
        // Size each column to the longest value in that column.
        const cols = Object.keys(data[0]).map((key) => {
          const maxLen = Math.max(
            key.length,
            ...data.map((row) => {
              const val = row[key];
              if (val instanceof Date) return 12; // Fixed width for dates
              return val ? val.toString().length : 0;
            }),
          );
          return { wch: maxLen + 2 };
        });
        ws['!cols'] = cols;
      };

      setColWidth(ws1, rawData || []);
      setColWidth(ws2, roomReport);
      setColWidth(ws3, courseReport);

      XLSX.writeFile(wb, `Booking_Report_${selectedMonth}.xlsx`);

      showMessage('Reports generated and downloaded successfully.', 'success');
    } catch (error: any) {
      console.error('Error generating reports:', error);
      showMessage(error.message || 'Failed to generate reports.', 'error');
    } finally {
      setLoading(false);
    }
  };
  return { selectedMonth, setSelectedMonth, loading, snackbar, handleCloseSnackbar, handleGenerateReports };
}
