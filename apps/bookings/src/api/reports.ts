import { supabase } from './_internal/supabase';
import { apiResult } from './_internal/result';

export const getBookingReportPage = (
  from: number,
  to: number,
  bookingDay: string,
  bookingDay1: string | number | boolean | null | undefined,
) =>
  apiResult(
    supabase
      .from('bookings')
      .select('*')
      .gte('booking_day', bookingDay1)
      .lte('booking_day', bookingDay)
      .range(from, to)
      .order('booking_day', { ascending: true }),
  );
