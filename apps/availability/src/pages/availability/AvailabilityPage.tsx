import { useAvailability } from '@/features/availability/hooks/useAvailability';
import { STYLES } from '@/features/availability/components/styles';
import { DoorOpen, DoorClosed, Presentation, Clock } from 'lucide-react';

// Components
import { Header } from '@/features/availability/components/Header';
import { MobileNav } from '@/features/availability/components/MobileNav';
import { RoomCard } from '@/features/availability/components/RoomCard';
import { QRCodeCard } from '@/features/availability/components/QRCodeCard';
import { HelpWidget } from '@/features/availability/components/HelpWidget';
import { OperationalInfoWidget } from '@/features/availability/components/OperationalInfoWidget';
import {
  LoadingScreen,
  ErrorScreen,
  AfterHoursScreen,
} from '@/features/availability/components/StatusScreens';

function App() {
  const {
    data,
    loading,
    error,
    lastUpdated,
    isLiveMode,
    isAfterHours,
    currentSlot,
    isPrevDisabled,
    isNextDisabled,
    fetchData,
    handleNext,
    handlePrev,
  } = useAvailability();

  if (loading && !data) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={fetchData} />;
  }

  if (isAfterHours && data) {
    return <AfterHoursScreen operationHours={data.operation_hours} saturdayHours={data.saturday_hours} />;
  }

  return (
    <div className={STYLES.pageContainer}>
      {/* A. Header Section */}
      <Header
        isLiveMode={isLiveMode}
        currentSlot={currentSlot}
        onPrev={handlePrev}
        onNext={handleNext}
        isPrevDisabled={isPrevDisabled}
        isNextDisabled={isNextDisabled}
        lastUpdated={lastUpdated}
        onRefresh={fetchData}
        loading={loading}
      />

      <main className={STYLES.mainContent}>
        {/* B. Mobile Navigation Bar (The Time Box) - Hidden on Desktop */}
        <MobileNav
          currentSlot={currentSlot}
          onPrev={handlePrev}
          onNext={handleNext}
          isPrevDisabled={isPrevDisabled}
          isNextDisabled={isNextDisabled}
        />

        {/* C. The Cards - Mobile Stack / Desktop Grid */}
        {currentSlot && data ? (
          <div className={STYLES.layout.gridContainer}>
            {/* 1. Open Rooms (Top Left) */}
            <RoomCard
              title="Open rooms"
              subtitle="Min 2 People"
              icon={<DoorOpen className="w-5 h-5 lg:w-12 lg:h-12" />}
              counts={currentSlot.availability['open room']}
              totalCapacity={data.totals['open room']}
              className="lg:h-full"
            />

            {/* 2. Closed Rooms (Top Right) */}
            <RoomCard
              title="Closed Rooms"
              subtitle="Min 4 Person"
              icon={<DoorClosed className="w-5 h-5 lg:w-12 lg:h-12" />}
              counts={currentSlot.availability['closed room']}
              totalCapacity={data.totals['closed room']}
              className="lg:h-full"
            />

            {/* 3. Boardrooms (Bottom Left) */}
            <RoomCard
              title="Boardrooms"
              subtitle="Min 6 Person"
              icon={<Presentation className="w-5 h-5 lg:w-12 lg:h-12" />}
              counts={currentSlot.availability['boardroom']}
              totalCapacity={data.totals['boardroom']}
              className="lg:h-full"
            />

            {/* 4. QR Code (Bottom Right for Desktop) */}
            <QRCodeCard />
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No availability data found.</p>
          </div>
        )}
      </main>

      {/* Floating Help Button & Modal */}
      <HelpWidget />

      {/* Operational Info Widget */}
      {data && (
        <OperationalInfoWidget operationHours={data.operation_hours} saturdayHours={data.saturday_hours} />
      )}
    </div>
  );
}

export default App;
