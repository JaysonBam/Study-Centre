import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Checkbox,
  Switch,
  Box,
  Typography,
  CircularProgress,
  Grid,
  FormHelperText,
  Alert,
} from '@mui/material';
import { format, parseISO, addMinutes } from 'date-fns';
import { ContextHelp } from '@/shared/ui/ContextHelp';
import { DateInput } from '@/shared/ui/DateInput';
import { TimeInput } from '@/shared/ui/TimeInput';
import type { BookingPanelProps } from '../types';
import { useBookingDraft } from '../hooks/useBookingDraft';
import { useBookingActions } from '../hooks/useBookingActions';
import { BookingRangeSection } from './BookingRangeSection';

export const BookingPanel: React.FC<BookingPanelProps> = (props) => {
  const { open, onClose, prefill = null, rooms, courses } = props;
  const draft = useBookingDraft(props);
  const {
    helpId,
    loading,
    saveError,
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
    selectedBorrowed,
    errors,
    contentRef,
    clearFieldError,
    isBulkEdit,
    bulkGroupBookings,
    isBulkBooking,
    setIsBulkBooking,
    bulkDates,
    bulkTimes,
    bulkRoomIds,
    setBulkRoomIds,
    isSmartSelecting,
    setIsSmartSelecting,
    rankedRooms,
    setRankedRooms,
    currentRankIndex,
    setCurrentRankIndex,
    smartRequestId,
    availableDurationOptions,
    availableExtensionOptions,
    toggleBorrowed,
    handleSmartSelect,
    selectNextRankedRoom,
  } = draft;
  const {
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
  } = useBookingActions(props, draft);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-describedby={helpId}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {isBulkEdit
            ? `Edit Bulk Group (${bulkGroupBookings.length} rooms)`
            : prefill?.booking
              ? 'Edit Booking'
              : 'New Booking'}
          {isBulkCount
            ? totalStudents && ` - ${totalStudents} students`
            : studentNumbers && ` - ${studentNumbers.split('\n').filter((l) => l.trim()).length} students`}
          <ContextHelp id={helpId} label="Booking help" description={helpDescription} />
        </Box>
        {!prefill?.booking && (
          <FormControlLabel
            control={<Switch checked={isBulkBooking} onChange={(e) => setIsBulkBooking(e.target.checked)} />}
            label="Bulk Mode"
          />
        )}
      </DialogTitle>
      <DialogContent ref={contentRef} dividers sx={{ overflowX: 'hidden' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {saveError && (
              <Grid item xs={12}>
                <Alert severity="error">{saveError}</Alert>
              </Grid>
            )}
            {isBulkBooking ? (
              <>
                <Grid item xs={12}>
                  <BookingRangeSection
                    kind="date"
                    ranges={bulkDates}
                    errors={errors}
                    validationErrors={rangeErrors}
                    onAdd={addBulkDate}
                    onChange={updateBulkDate}
                    onRemove={(id, index) => removeRange('date', id, index)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <BookingRangeSection
                    kind="time"
                    ranges={bulkTimes}
                    errors={errors}
                    validationErrors={rangeErrors}
                    onAdd={addBulkTime}
                    onChange={updateBulkTime}
                    onRemove={(id, index) => removeRange('time', id, index)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography id="bulk-rooms-label" variant="subtitle2">
                      Rooms
                    </Typography>
                    <Box display="flex" gap={1}>
                      {bulkRoomIds.length > 0 && (
                        <Button size="small" onClick={() => setBulkRoomIds([])}>
                          Clear
                        </Button>
                      )}
                      {rooms.some((r) => !bulkRoomIds.includes(String(r.id))) && (
                        <Button
                          size="small"
                          onClick={() => {
                            clearFieldError('bulkRooms');
                            setBulkRoomIds(rooms.map((r) => String(r.id)));
                          }}
                        >
                          Select all
                        </Button>
                      )}
                    </Box>
                  </Box>
                  <Box
                    role="group"
                    aria-labelledby="bulk-rooms-label"
                    aria-invalid={!!errors.bulkRooms && !bulkRoomIds.length}
                    tabIndex={-1}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      p: 1,
                      maxHeight: 150,
                      overflow: 'auto',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                    }}
                  >
                    {rooms.map((r) => (
                      <FormControlLabel
                        key={r.id}
                        control={
                          <Checkbox
                            checked={bulkRoomIds.includes(String(r.id))}
                            onChange={() => toggleBulkRoom(String(r.id))}
                          />
                        }
                        label={r.name}
                      />
                    ))}
                  </Box>
                  {errors.bulkRooms && <FormHelperText error>Select at least one room</FormHelperText>}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Staff Name"
                    value={staffName}
                    onChange={(e) => {
                      setStaffName(e.target.value);
                      setIsNameManuallyTyped(true);
                      clearFieldError('staffName');
                    }}
                    error={!!errors.staffName}
                    helperText={errors.staffName}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <Box display="flex" gap={1} alignItems="flex-start">
                    <TextField
                      select
                      fullWidth
                      label="Room"
                      value={roomId}
                      onChange={(e) => {
                        setRoomId(e.target.value);
                        clearFieldError('roomId');
                      }}
                      error={!!errors.roomId}
                      helperText={errors.roomId}
                    >
                      {rooms.map((r) => {
                        const status = getRoomStatus(String(r.id));
                        if (
                          String(r.id) !== String(roomId) &&
                          (status?.text === 'Occupied' ||
                            (status?.text === 'Reserved' && !status.text.includes('late')))
                        )
                          return null;
                        return (
                          <MenuItem key={r.id} value={String(r.id)}>
                            <Box display="flex" justifyContent="space-between" width="100%">
                              <Typography color={status?.color || 'inherit'}>
                                {r.name} {status?.text && `(${status.text})`}
                              </Typography>
                              {r.dynamic_labels && r.dynamic_labels.length > 0 && (
                                <Typography sx={{ ml: 1, display: 'flex', gap: 0.5 }}>
                                  {r.dynamic_labels.map((l: any, idx: number) => (
                                    <span
                                      key={idx}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        marginRight: 2,
                                      }}
                                    >
                                      <span
                                        style={{
                                          position: 'absolute',
                                          left: '50%',
                                          top: '50%',
                                          transform: 'translate(-50%, -50%)',
                                          width: 18,
                                          height: 18,
                                          borderRadius: '50%',
                                          background: '#b0b3b8',
                                          zIndex: 0,
                                        }}
                                      />
                                      <span style={{ position: 'relative', zIndex: 1, color: '#222' }}>
                                        {l.split(' ').pop()}
                                      </span>
                                    </span>
                                  ))}
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </TextField>
                    {!prefill?.booking &&
                      (isSmartSelecting ? (
                        <Button
                          variant="outlined"
                          onClick={selectNextRankedRoom}
                          sx={{ height: 56, textTransform: 'none', lineHeight: 1.2, minWidth: 120, ml: 1 }}
                        >
                          Next ({currentRankIndex + 1}/{rankedRooms.length})
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          onClick={handleSmartSelect}
                          sx={{ height: 56, minWidth: 120, ml: 1 }}
                        >
                          Smart Select
                        </Button>
                      ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateInput
                    fullWidth
                    label="Date"
                    value={startDate}
                    onChange={(val) => {
                      setStartDate(val);
                      clearFieldError('startDate');
                    }}
                    helperText={errors.startDate}
                    error={!!errors.startDate}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TimeInput
                    fullWidth
                    label="Start Time"
                    value={startClock}
                    onChange={(value) => {
                      setStartClock(value);
                      clearFieldError('startClock');
                    }}
                    error={!!errors.startClock}
                    helperText={errors.startClock}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Duration"
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      clearFieldError('duration');
                      smartRequestId.current += 1;
                      setIsSmartSelecting(false);
                      setRankedRooms([]);
                      setCurrentRankIndex(0);
                    }}
                    error={!!errors.duration}
                    helperText={errors.duration}
                    SelectProps={{
                      renderValue: (val: unknown) => {
                        if (!val) return '';
                        const d = Number(val);
                        return isNaN(d) ? '' : `${d} mins`;
                      },
                    }}
                  >
                    {availableDurationOptions.map((d) => {
                      const endTime = startClock
                        ? format(addMinutes(parseISO(`2000-01-01T${startClock}`), d), 'HH:mm')
                        : null;
                      return (
                        <MenuItem key={d} value={String(d)}>
                          <Box display="flex" justifyContent="space-between" width="100%">
                            <span>{d} mins</span>
                            {endTime && (
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                until {endTime}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Staff Name"
                    value={staffName}
                    onChange={(e) => {
                      setStaffName(e.target.value);
                      setIsNameManuallyTyped(true);
                      clearFieldError('staffName');
                    }}
                    error={!!errors.staffName}
                    helperText={errors.staffName}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.selectedCourseId}>
                <InputLabel id="booking-course-label">Course</InputLabel>
                <Select
                  labelId="booking-course-label"
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value as string);
                    clearFieldError('selectedCourseId');
                  }}
                  label="Course"
                >
                  {courses.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {errors.selectedCourseId && <FormHelperText>{errors.selectedCourseId}</FormHelperText>}
              </FormControl>
              {selectedCourseId === 'other' && (
                <TextField
                  fullWidth
                  sx={{ mt: 1 }}
                  label="Course Name"
                  value={otherCourseName}
                  onChange={(e) => {
                    setOtherCourseName(e.target.value);
                    clearFieldError('otherCourseName');
                  }}
                  error={!!errors.otherCourseName}
                  helperText={errors.otherCourseName}
                />
              )}
            </Grid>

            {!isBulkBooking && (
              <>
                <Grid item xs={12}>
                  {isBulkCount ? (
                    <TextField
                      type="number"
                      fullWidth
                      label="Total Students (Entire Bulk Group)"
                      value={totalStudents}
                      onChange={(e) => {
                        setTotalStudents(e.target.value);
                        clearFieldError('totalStudents');
                      }}
                      error={!!errors.totalStudents}
                      helperText={errors.totalStudents || 'This count is shared across the bulk group'}
                    />
                  ) : (
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      label="Student Numbers"
                      value={studentNumbers}
                      onChange={(e) => setStudentNumbers(e.target.value)}
                    />
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Borrowed Items</Typography>
                  {borrowableItems.length === 0 ? (
                    <Typography variant="caption">None available</Typography>
                  ) : (
                    <Box>
                      {borrowableItems.map((it) => (
                        <FormControlLabel
                          key={it}
                          control={
                            <Checkbox checked={!!selectedBorrowed[it]} onChange={() => toggleBorrowed(it)} />
                          }
                          label={it}
                        />
                      ))}
                    </Box>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {prefill?.booking ? (
          <>
            <Box flexGrow={1} display="flex" gap={1}>
              <TextField
                select
                size="small"
                label="Extend"
                value={selectedExtension}
                onChange={(e) => setSelectedExtension(e.target.value)}
                sx={{ width: 120 }}
              >
                {availableExtensionOptions.map((m) => (
                  <MenuItem key={m} value={String(m)}>
                    +{m} mins
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="State"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value as any)}
                sx={{ width: 120 }}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Reserved">Reserved</MenuItem>
                <MenuItem value="Ended">Ended</MenuItem>
              </TextField>
            </Box>
            <Button color="error" onClick={handleDelete} disabled={loading}>
              Delete
            </Button>
            <Button variant="contained" onClick={() => handleSave(selectedState)} disabled={loading}>
              Update
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button
              variant={shouldHighlightReserve ? 'contained' : 'outlined'}
              color={shouldHighlightReserve ? 'primary' : 'inherit'}
              onClick={() => handleSave('Reserved')}
              disabled={loading}
            >
              Reserve
            </Button>
            <Button
              variant={shouldHighlightReserve ? 'outlined' : 'contained'}
              color="primary"
              onClick={() => handleSave('Active')}
              disabled={loading}
            >
              Book (Active)
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
