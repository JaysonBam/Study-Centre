import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  CircularProgress,
  Container,
  Snackbar,
  Alert,
  Grid,
  Paper,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import SchoolIcon from '@mui/icons-material/School';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { useBookingReports } from '../hooks/useBookingReports';

export default function ReportPage() {
  const { selectedMonth, setSelectedMonth, loading, snackbar, handleCloseSnackbar, handleGenerateReports } =
    useBookingReports();
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1, md: 3 }, pt: { xs: 2, md: 3 } }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, md: 3 },
                display: 'flex',
                alignItems: { xs: 'flex-start', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 2, md: 4 },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
                  Monthly Analytics Export
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select a month to generate comprehensive Excel reports for administration and planning.
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  width: { xs: '100%', md: 'auto' },
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <TextField
                  id="month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 200 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateReports}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  size="large"
                  sx={{ whiteSpace: 'nowrap', width: { xs: '100%', sm: 'auto' }, px: 3, py: 1 }}
                >
                  {loading ? 'Generating...' : 'Download Excel Report'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2, mb: 2 }}>
              Included in Report
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText', width: 48, height: 48 }}>
                  <TableChartIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Raw Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete data of all bookings.
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ p: 2, bgcolor: 'action.hover', height: '100%' }}>
                <Typography variant="caption" color="text.secondary" component="div">
                  <Stack spacing={1}>
                    <Box>• Date & Time details</Box>
                    <Box>• Booker information</Box>
                    <Box>• Duration & Student counts</Box>
                  </Stack>
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', width: 48, height: 48 }}
                >
                  <MeetingRoomIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Room Statistics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usage by room.
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ p: 2, bgcolor: 'action.hover', height: '100%' }}>
                <Typography variant="caption" color="text.secondary" component="div">
                  <Stack spacing={1}>
                    <Box>• Total booking count</Box>
                    <Box>• Total hours utilized</Box>
                  </Stack>
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
                <Avatar
                  sx={{ bgcolor: 'success.light', color: 'success.contrastText', width: 48, height: 48 }}
                >
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Course Statistics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usages by course.
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ p: 2, bgcolor: 'action.hover', height: '100%' }}>
                <Typography variant="caption" color="text.secondary" component="div">
                  <Stack spacing={1}>
                    <Box>• Bookings per course</Box>
                    <Box>• Hours allocated to course</Box>
                  </Stack>
                </Typography>
              </Box>
            </Card>
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
