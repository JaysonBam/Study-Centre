import { ConfirmDialogProvider } from '../context/ConfirmDialogContext';
import { NowProvider } from '../context/NowContext';
import { BookingsContent } from './BookingSchedule';

export default function Bookings() {
  return (
    <ConfirmDialogProvider>
      <NowProvider>
        <BookingsContent />
      </NowProvider>
    </ConfirmDialogProvider>
  );
}
