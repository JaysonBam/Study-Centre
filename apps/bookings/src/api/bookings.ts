import { supabase } from './_internal/supabase';
import { apiResult } from './_internal/result';

export const listScheduleBookings = (bookingDay: string) =>
  apiResult(
    supabase
      .from('bookings')
      .select(`*, courses(id, name, color_hex), borrowed_items`)
      .eq('booking_day', bookingDay),
  );

export const getBookingGroup = (bulkBookingId: string) =>
  apiResult(supabase.from('bookings').select('*').eq('bulk_booking_id', bulkBookingId));

export const listAvailabilityBookings = (bookingDay: string) =>
  apiResult(
    supabase
      .from('bookings')
      .select('id, room_id, start_time, end_time, state, booking_day')
      .eq('booking_day', bookingDay),
  );

export const listConflictSlots = (bookingDay: string) =>
  apiResult(
    supabase.from('bookings').select('id, room_id, start_time, end_time').eq('booking_day', bookingDay),
  );

export const endBookingGroup = (bulkBookingId: string, updates: Record<string, unknown>) =>
  apiResult(supabase.from('bookings').update(updates).eq('bulk_booking_id', bulkBookingId));

export const createBookings = (records: Record<string, unknown> | Record<string, unknown>[]) =>
  apiResult(supabase.from('bookings').insert(records));

export const updateBookingGroup = (bulkBookingId: string, updates: Record<string, unknown>) =>
  apiResult(supabase.from('bookings').update(updates).eq('bulk_booking_id', bulkBookingId).select('id'));

export const deleteBookings = (id: readonly (string | number)[]) =>
  apiResult(supabase.from('bookings').delete().in('id', id));

export const findEarlierBookings = (startTime: string, bookingDay: string, roomId: string | number) =>
  apiResult(
    supabase
      .from('bookings')
      .select('id, start_time, end_time, state')
      .eq('room_id', roomId)
      .eq('booking_day', bookingDay)
      .lt('start_time', startTime)
      .neq('state', 'Ended'),
  );

export const endEarlierBookings = (
  startTime: string,
  bookingDay: string,
  roomId: string | number,
  updates: Record<string, unknown>,
) =>
  apiResult(
    supabase
      .from('bookings')
      .update(updates)
      .eq('room_id', roomId)
      .eq('booking_day', bookingDay)
      .lt('start_time', startTime)
      .neq('state', 'Ended'),
  );

export const deleteBooking = (id: string | number) =>
  apiResult(supabase.from('bookings').delete().eq('id', id));

export const updateBooking = (id: string | number, updates: Record<string, unknown>) =>
  apiResult(supabase.from('bookings').update(updates).eq('id', id));

export const createBooking = (records: Record<string, unknown> | Record<string, unknown>[]) =>
  apiResult(supabase.from('bookings').insert(records));

export const deleteBookingGroup = (bulkBookingId: string) =>
  apiResult(supabase.from('bookings').delete().eq('bulk_booking_id', bulkBookingId));

export const searchBookingsForDate = (bookingDay: string) =>
  apiResult(
    supabase
      .from('bookings')
      .select(
        `
        id,
        room_id,
        start_time,
        end_time,
        state,
        student_numbers,
        booked_by,
        booking_day,
        rooms (
          name
        )
      `,
      )
      .eq('booking_day', bookingDay),
  );

export const getBooking = (id: string | number) =>
  apiResult(supabase.from('bookings').select('*').eq('id', id).single());

export const getBookingHandover = (id: string | number) =>
  apiResult(
    supabase
      .from('bookings')
      .select('start_time, end_time, booking_day, borrowed_items, bulk_booking_id, room_id, rooms(name)')
      .eq('id', id)
      .single(),
  );

export const updateBookingGroupState = (bulkBookingId: string, updates: Record<string, unknown>) =>
  apiResult(supabase.from('bookings').update(updates).eq('bulk_booking_id', bulkBookingId));

export function subscribeToBookings(date: string, onChange: () => void) {
  const channel = supabase.channel(`bookings_realtime_${date}_${Date.now()}`);
  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
      if ((payload.new && 'booking_day' in payload.new && payload.new.booking_day === date) || payload.old)
        onChange();
    })
    .subscribe(() => {});
  return () => {
    void channel.unsubscribe();
  };
}
