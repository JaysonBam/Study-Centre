import { BookingGrid } from './BookingGrid';
import { BookingPanel } from './BookingPanel';
import { SearchPanel } from './SearchPanel';
import { Snackbar, Alert } from '@mui/material';
import { StyledPageContainer, StyledContentContainer, StyledGridContainer } from './styles';
import { useBookingSchedule } from '../hooks/useBookingSchedule';

export function BookingsContent() {
  const {
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
  } = useBookingSchedule();
  return (
    <StyledPageContainer>
      <StyledContentContainer>
        <StyledGridContainer>
          <BookingGrid
            selectedDate={selectedDate}
            onCellClick={handleCellClick}
            onBookingClick={handleBookingClick}
            onQuickAction={handleQuickAction}
            onStatusCountsChange={handleStatusCountsChange}
            highlightedBookingId={highlightedBookingId}
            refreshTrigger={refreshGridTrigger}
            showToast={showToast}
          />
        </StyledGridContainer>
        <SearchPanel
          isOpen={isSearchOpen}
          onClose={() => {
            setIsSearchOpen(false);
            setInitialSearchFilter(null);
          }}
          selectedDate={selectedDate}
          onBookingSelect={handleBookingSelect}
          showToast={showToast}
          initialFilter={initialSearchFilter}
        />
      </StyledContentContainer>

      <BookingPanel
        key={
          panelOpen
            ? panelData?.booking?.id
              ? `edit-${panelData.booking.id}`
              : `new-${panelData?.roomId || ''}-${panelData?.timeSlot || ''}`
            : 'closed'
        }
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setPanelData(null);
          setCreationStartTime(null);
        }}
        prefill={panelData}
        defaultStaffName={currentUser}
        showToast={showToast}
        onBookingUpdate={(staffName) => {
          if (staffName !== undefined) setCurrentUser(staffName);
          setRefreshGridTrigger((prev) => prev + 1);
        }}
        rooms={rooms}
        courses={courses}
        creationStartTime={creationStartTime}
      />
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </StyledPageContainer>
  );
}
