import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Modal,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import Header from '@/shared/ui/Header';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { hasProfileAccess } from '../model/accessExpiry';
import { useAccessManagement } from '../hooks/useAccessManagement';

export default function AccessPage() {
  const {
    isMobile,
    styles,
    loading,
    openModal,
    setOpenModal,
    newEmail,
    setNewEmail,
    addError,
    adding,
    newDuration,
    setNewDuration,
    actionMenu,
    setActionMenu,
    expiryProfile,
    setExpiryProfile,
    duration,
    setDuration,
    savingExpiry,
    expiryError,
    hexForgeLoading,
    openHexForgeModal,
    setOpenHexForgeModal,
    newHexForgeEmail,
    setNewHexForgeEmail,
    hexForgeAddError,
    hexForgeAdding,
    snackbar,
    handleCloseSnackbar,
    activeProfiles,
    inactiveProfiles,
    openExpiry,
    handleDeactivate,
    handleSaveExpiry,
    renderExpirySelect,
    handleDelete,
    handleAddUser,
    handleAddHexForgeUser,
    renderMobileView,
    renderDesktopView,
    renderHexForgeMobileView,
    renderHexForgeDesktopView,
  } = useAccessManagement();
  return (
    <Box sx={styles.root}>
      <Header title="User Management" />

      <Box sx={{ mb: 4, mt: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box sx={{ maxWidth: '800px' }}>
            <Typography variant="body1" sx={{ color: 'text.primary', mb: 1 }}>
              All users have <strong>viewer access</strong> to Bookings, Management, Bugs, and Documentation
              by default.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the table below to toggle advanced administration privileges.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            fullWidth={isMobile}
            sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
          >
            Add User
          </Button>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 2,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 3, md: 2 }}
            divider={
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
            }
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 0.5, letterSpacing: 0.5 }}>
                ACCESS
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                User Management
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manage system administrators and user permissions.
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 0.5, letterSpacing: 0.5 }}>
                SETTINGS
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                System Configuration
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Modify global settings, room configurations, and course details.
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 0.5, letterSpacing: 0.5 }}>
                ANALYTICS
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Data Insights
              </Typography>
              <Typography variant="caption" color="text.secondary">
                View usage statistics and download reports.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        renderMobileView(activeProfiles)
      ) : (
        renderDesktopView(activeProfiles)
      )}

      {!loading && inactiveProfiles.length > 0 && (
        <Accordion defaultExpanded={false} elevation={0} sx={{ mt: 2, border: 1, borderColor: 'divider' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Inactive users ({inactiveProfiles.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {isMobile ? renderMobileView(inactiveProfiles) : renderDesktopView(inactiveProfiles)}
          </AccordionDetails>
        </Accordion>
      )}

      <Menu anchorEl={actionMenu?.anchor} open={!!actionMenu} onClose={() => setActionMenu(null)}>
        {actionMenu && hasProfileAccess(actionMenu.profile)
          ? [
              <MenuItem key="expiry" onClick={() => openExpiry(actionMenu!.profile)}>
                Set expiry date
              </MenuItem>,
              <MenuItem key="deactivate" onClick={() => handleDeactivate(actionMenu!.profile)}>
                Deactivate
              </MenuItem>,
            ]
          : actionMenu && <MenuItem onClick={() => openExpiry(actionMenu.profile)}>Activate</MenuItem>}
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            if (actionMenu) handleDelete(actionMenu.profile.email);
            setActionMenu(null);
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      <Modal
        open={!!expiryProfile}
        onClose={() => {
          if (!savingExpiry) setExpiryProfile(null);
        }}
      >
        <Box sx={styles.modalContent} component="form" onSubmit={handleSaveExpiry}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {hasProfileAccess(expiryProfile) ? 'Set expiry date' : 'Activate user'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, overflowWrap: 'anywhere' }}>
            {expiryProfile?.email}. The duration starts when you save.
          </Typography>
          <Stack spacing={2}>
            {expiryError && <Alert severity="error">{expiryError}</Alert>}
            {renderExpirySelect(duration, setDuration)}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button disabled={savingExpiry} onClick={() => setExpiryProfile(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={savingExpiry}>
                {savingExpiry ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Modal>

      <Box sx={{ mt: 5, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box sx={{ maxWidth: '800px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              3D Printing / HexForge Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage the HexForge allow-list for MISC 3D printing staff access.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenHexForgeModal(true)}
            fullWidth={isMobile}
            sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
          >
            Add 3D Printing User
          </Button>
        </Stack>
      </Box>

      {hexForgeLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        renderHexForgeMobileView()
      ) : (
        renderHexForgeDesktopView()
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={styles.modalContent} component="form" onSubmit={handleAddUser}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add New User
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please enter the user's primary Google account (Gmail address).
            <br />
            <strong>Note:</strong> Ensure it is the actual email address (e.g.,{' '}
            <code>student@example.invalid</code>) and not an alias (like <code>staff@example.invalid</code>).
          </Typography>

          <Stack spacing={2}>
            {addError && <Alert severity="error">{addError}</Alert>}
            <TextField
              label="Gmail Address"
              type="email"
              fullWidth
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            {renderExpirySelect(newDuration, setNewDuration)}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button onClick={() => setOpenModal(false)} disabled={adding}>
                Cancel
              </Button>
              <Button variant="contained" type="submit" disabled={adding}>
                {adding ? 'Adding...' : 'Add User'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openHexForgeModal} onClose={() => setOpenHexForgeModal(false)}>
        <Box sx={styles.modalContent} component="form" onSubmit={handleAddHexForgeUser}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add 3D Printing User
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the user's primary Google account to allow access to HexForge.
            <br />
            <strong>Note:</strong> This creates a pending 3D printing profile that becomes active when the
            user signs in.
          </Typography>

          <Stack spacing={2}>
            {hexForgeAddError && <Alert severity="error">{hexForgeAddError}</Alert>}
            <TextField
              label="Gmail Address"
              type="email"
              fullWidth
              required
              value={newHexForgeEmail}
              onChange={(e) => setNewHexForgeEmail(e.target.value)}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button onClick={() => setOpenHexForgeModal(false)} disabled={hexForgeAdding}>
                Cancel
              </Button>
              <Button variant="contained" type="submit" disabled={hexForgeAdding}>
                {hexForgeAdding ? 'Adding...' : 'Add User'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
