import { DateInput } from '@/shared/ui/DateInput';
import { TimeInput } from '@/shared/ui/TimeInput';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Container,
  Snackbar,
  Alert,
  Grid,
  Switch,
  IconButton,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  LinearProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SchoolIcon from '@mui/icons-material/School';
import { NewRoomRow, NewCourseRow } from './SettingsFields';
import { useSettingsEditor } from '../hooks/useSettingsEditor';

export default function SettingsPage() {
  const {
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
  } = useSettingsEditor();
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1, md: 3 }, pt: { xs: 2, md: 3 } }}>
        <Paper
          sx={{
            p: { xs: 1.5, md: 2 },
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 2, md: 3 },
            mt: 0,
          }}
          elevation={2}
          square
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Configuration
            </Typography>
            {savingAll && (
              <Typography variant="caption" color="text.secondary">
                Saving changes...
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveAllRooms}
            disabled={savingAll}
          >
            Save All Changes
          </Button>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <AccessTimeIcon color="action" />
                <Typography variant="h6">Operation Hours</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} alignItems="center">
                <TimeInput
                  label="Start Time"
                  value={opStart}
                  onChange={setOpStart}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
                <TimeInput
                  label="End Time"
                  value={opEnd}
                  onChange={setOpEnd}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="subtitle1">Saturday Opening</Typography>
                <Switch
                  checked={satEnabled}
                  onChange={(e) => setSatEnabled(e.target.checked)}
                  color="primary"
                />
              </Box>
              {satEnabled && (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <TimeInput
                    label="Saturday Start"
                    value={satStart}
                    onChange={setSatStart}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                  <TimeInput
                    label="Saturday End"
                    value={satEnd}
                    onChange={setSatEnd}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                </Stack>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <BuildIcon color="action" />
                <Typography variant="h6">Clock Testing Mode</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Enable Testing Clock</Typography>
                  <Switch checked={testingEnabled} onChange={(e) => setTestingEnabled(e.target.checked)} />
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <DateInput
                    label="Test Date"
                    value={testingDate}
                    onChange={setTestingDate}
                    disabled={!testingEnabled}
                    fullWidth
                    size="small"
                  />
                  <TimeInput
                    label="Test Time"
                    value={testingTime}
                    onChange={setTestingTime}
                    InputLabelProps={{ shrink: true }}
                    disabled={!testingEnabled}
                    fullWidth
                    size="small"
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Use this to override the system clock for testing scheduling features.
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <MeetingRoomIcon />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Rooms Management
                </Typography>
              </Box>
              <Divider />
              {loadingRooms && <LinearProgress />}
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell width={100}>Max People</TableCell>
                      <TableCell width={100}>Min People</TableCell>
                      <TableCell>Borrowable Items</TableCell>
                      <TableCell align="center" width={100}>
                        Available
                      </TableCell>
                      <TableCell align="right" width={80}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rooms.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <TextField
                            value={r.name}
                            onChange={(e) =>
                              setRooms((s) =>
                                s.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)),
                              )
                            }
                            size="small"
                            variant="standard"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={r.max_people ?? ''}
                            onChange={(e) =>
                              setRooms((s) =>
                                s.map((x) =>
                                  x.id === r.id
                                    ? { ...x, max_people: e.target.value ? Number(e.target.value) : null }
                                    : x,
                                ),
                              )
                            }
                            size="small"
                            variant="standard"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={r.min_people ?? ''}
                            onChange={(e) =>
                              setRooms((s) =>
                                s.map((x) =>
                                  x.id === r.id
                                    ? { ...x, min_people: e.target.value ? Number(e.target.value) : null }
                                    : x,
                                ),
                              )
                            }
                            size="small"
                            variant="standard"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={borrowableInputs[r.id] ?? (r.borrowable_items ?? []).join(', ')}
                            onChange={(e) => setBorrowableInputs((s) => ({ ...s, [r.id]: e.target.value }))}
                            onBlur={(e) => {
                              const parsed = e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                              setRooms((s) =>
                                s.map((x) =>
                                  x.id === r.id
                                    ? { ...x, borrowable_items: parsed.length ? parsed : null }
                                    : x,
                                ),
                              );
                              setBorrowableInputs((s) => ({ ...s, [r.id]: parsed.join(', ') }));
                            }}
                            placeholder="e.g. Projector, PC"
                            size="small"
                            variant="standard"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={!!r.is_available}
                            onChange={(e) => handleToggleRoomField(r.id, 'is_available', e.target.checked)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => deleteRoom(r.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <NewRoomRow onCreate={createRoom} />
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ width: '100%', overflow: 'hidden', height: '100%' }}>
              <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <SchoolIcon />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Courses
                </Typography>
              </Box>
              <Divider />
              {loadingCourses && <LinearProgress />}
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Course Name</TableCell>
                      <TableCell width={100}>Color</TableCell>
                      <TableCell align="right" width={80}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <TextField
                            value={c.name}
                            onChange={(e) =>
                              setCourses((s) =>
                                s.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)),
                              )
                            }
                            size="small"
                            variant="standard"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <input
                              type="color"
                              value={c.color_hex ?? '#000000'}
                              onChange={(e) =>
                                setCourses((s) =>
                                  s.map((x) => (x.id === c.id ? { ...x, color_hex: e.target.value } : x)),
                                )
                              }
                              style={{
                                border: 'none',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                              }}
                            />
                            <Typography variant="caption">{c.color_hex}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => deleteCourse(c.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <NewCourseRow onCreate={createCourse} />
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
