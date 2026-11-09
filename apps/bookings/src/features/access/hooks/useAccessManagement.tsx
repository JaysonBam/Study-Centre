import {
  listProfiles,
  setAccessExpiry,
  updateProfilePermission,
  deleteProfile,
  addProfileAccess,
} from '@/api/profiles';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Switch,
  IconButton,
  Button,
  Tooltip,
  TextField,
  Stack,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Divider,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTheme } from '@mui/material/styles';
import { styles as makeStyles } from '../components/styles';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { accessDurations, formatAccessExpiry, hasProfileAccess } from '../model/accessExpiry';
import {
  addHexForgeProfile,
  deleteHexForgeProfile,
  fetchHexForgeProfiles as fetchHexForgeProfilesFromApi,
  type HexForgeProfile,
} from '@/api/printingAccess';
import { Profile, permissionFields, getErrorMessage } from '../model/accessManagementModel';

export function useAccessManagement() {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const styles = makeStyles(theme);

  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);

  const [newEmail, setNewEmail] = useState('');

  const [addError, setAddError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);

  const [newDuration, setNewDuration] = useState('never');

  const [actionMenu, setActionMenu] = useState<{ anchor: HTMLElement; profile: Profile } | null>(null);

  const [expiryProfile, setExpiryProfile] = useState<Profile | null>(null);

  const [duration, setDuration] = useState('never');

  const [savingExpiry, setSavingExpiry] = useState(false);

  const [expiryError, setExpiryError] = useState<string | null>(null);

  const [hexForgeProfiles, setHexForgeProfiles] = useState<HexForgeProfile[]>([]);

  const [hexForgeLoading, setHexForgeLoading] = useState(true);

  const [openHexForgeModal, setOpenHexForgeModal] = useState(false);

  const [newHexForgeEmail, setNewHexForgeEmail] = useState('');

  const [hexForgeAddError, setHexForgeAddError] = useState<string | null>(null);

  const [hexForgeAdding, setHexForgeAdding] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = useCallback((message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await listProfiles();

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      showToast('Failed to load user profiles', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchHexForgeProfiles = useCallback(async () => {
    try {
      setHexForgeLoading(true);
      const profiles = await fetchHexForgeProfilesFromApi();
      setHexForgeProfiles(profiles || []);
    } catch (error) {
      console.error('Error fetching HexForge profiles:', error);
      showToast('Failed to load 3D printing access list', 'error');
    } finally {
      setHexForgeLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProfiles();
    fetchHexForgeProfiles();
  }, [fetchProfiles, fetchHexForgeProfiles]);

  const activeProfiles = profiles.filter((profile) => hasProfileAccess(profile));

  const inactiveProfiles = profiles.filter((profile) => !hasProfileAccess(profile));

  const openExpiry = (profile: Profile) => {
    setActionMenu(null);
    setDuration('never');
    setExpiryError(null);
    setExpiryProfile(profile);
  };

  const setExpiry = async (profile: Profile, hours: number | null) => {
    const { error } = await setAccessExpiry({
      target_email: profile.email,
      duration_hours: hours,
    });
    if (error) throw error;
    await fetchProfiles();
  };

  const handleDeactivate = async (profile: Profile) => {
    setActionMenu(null);
    try {
      await setExpiry(profile, 0);
      showToast('User deactivated');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to deactivate user'), 'error');
    }
  };

  const handleSaveExpiry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!expiryProfile) return;
    setSavingExpiry(true);
    setExpiryError(null);
    try {
      await setExpiry(expiryProfile, duration === 'never' ? null : Number(duration));
      setExpiryProfile(null);
      showToast('User access updated');
    } catch (error) {
      setExpiryError(getErrorMessage(error, 'Failed to update access'));
    } finally {
      setSavingExpiry(false);
    }
  };

  const renderExpirySelect = (value: string, onChange: (value: string) => void) => (
    <TextField
      select
      label="Access expires"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {accessDurations.map((option) => (
        <MenuItem key={option.label} value={option.hours === null ? 'never' : String(option.hours)}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );

  const renderActions = (profile: Profile) => (
    <Tooltip title="User actions">
      <IconButton
        size="small"
        aria-label={`Actions for ${profile.email}`}
        onClick={(event) => setActionMenu({ anchor: event.currentTarget, profile })}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const handleToggle = async (
    email: string,
    field: 'settings' | 'authorisation' | 'analytics',
    currentValue: boolean,
  ) => {
    try {
      setProfiles((prev) => prev.map((p) => (p.email === email ? { ...p, [field]: !currentValue } : p)));

      const { error } = await updateProfilePermission(email, { [field]: !currentValue });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating permission:', error);
      showToast('Failed to update permission', 'error');
      fetchProfiles();
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email}?`)) return;

    try {
      const { data, error } = await deleteProfile(email);

      if (error) throw error;
      if (!data?.length) throw new Error('User was not removed. Refresh and check your access.');
      setProfiles((prev) => prev.filter((p) => p.email !== email));
      showToast('User removed successfully', 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
      fetchProfiles();
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAdding(true);

    try {
      const { error } = await addProfileAccess({
        target_email: newEmail,
        duration_hours: newDuration === 'never' ? null : Number(newDuration),
        add_user: true,
      });

      if (error) {
        if (error.code === '23505') throw new Error('User already exists');
        throw error;
      }

      showToast('User added successfully', 'success');
      setNewEmail('');
      setNewDuration('never');
      setOpenModal(false);
      fetchProfiles();
    } catch (err) {
      setAddError(getErrorMessage(err, 'Failed to add user'));
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteHexForgeUser = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from 3D printing access?`)) return;

    try {
      setHexForgeProfiles((prev) => prev.filter((p) => p.email !== email));
      await deleteHexForgeProfile(email);
      showToast('3D printing user removed successfully', 'success');
    } catch (error) {
      console.error('Error deleting HexForge user:', error);
      showToast('Failed to remove 3D printing user', 'error');
      fetchHexForgeProfiles();
    }
  };

  const handleAddHexForgeUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setHexForgeAddError(null);
    setHexForgeAdding(true);

    try {
      await addHexForgeProfile(newHexForgeEmail);
      showToast('3D printing user added successfully', 'success');
      setNewHexForgeEmail('');
      setOpenHexForgeModal(false);
      fetchHexForgeProfiles();
    } catch (err) {
      setHexForgeAddError(getErrorMessage(err, 'Failed to add 3D printing user'));
    } finally {
      setHexForgeAdding(false);
    }
  };

  const renderMobileView = (rows: Profile[]) => (
    <Stack spacing={2}>
      {rows.map((profile) => (
        <Card key={profile.email} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <Avatar
                src={profile.profile_url || undefined}
                alt={profile.full_name || ''}
                imgProps={{ referrerPolicy: 'no-referrer' }}
              >
                {(profile.full_name || profile.email)[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                  {profile.full_name || 'Unknown Name'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {profile.email}
                </Typography>
              </Box>
              <Chip
                label={hasProfileAccess(profile) ? profile.status : 'inactive'}
                size="small"
                color={hasProfileAccess(profile) && profile.status === 'active' ? 'success' : 'default'}
                variant={hasProfileAccess(profile) && profile.status === 'active' ? 'filled' : 'outlined'}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Access expires: {formatAccessExpiry(profile.access_expires_at)}
            </Typography>
            <Stack spacing={1}>
              {permissionFields.map((permission) => (
                <Box
                  key={permission}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {permission === 'authorisation' ? 'Access' : permission}
                  </Typography>
                  <Switch
                    size="small"
                    checked={profile[permission]}
                    onChange={() => handleToggle(profile.email, permission, profile[permission])}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 2, px: 2 }}>
            {renderActions(profile)}
          </CardActions>
        </Card>
      ))}
      {rows.length === 0 && (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No users found
        </Typography>
      )}
    </Stack>
  );

  const renderDesktopView = (rows: Profile[]) => (
    <TableContainer component={Paper} elevation={0} sx={styles.tableContainer}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Access expires</TableCell>
            <TableCell align="center">Settings</TableCell>
            <TableCell align="center">Analytics</TableCell>
            <TableCell align="center">Access</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((profile) => (
            <TableRow key={profile.email} hover>
              <TableCell>
                <Box sx={styles.userCell}>
                  {profile.status === 'active' ? (
                    <>
                      <Avatar
                        src={profile.profile_url || undefined}
                        alt={profile.full_name || ''}
                        imgProps={{ referrerPolicy: 'no-referrer' }}
                        sx={styles.avatar}
                      >
                        {(profile.full_name || profile.email)[0].toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {profile.full_name || 'Unknown Name'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {profile.email}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Avatar sx={styles.avatar}>?</Avatar>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: 'text.secondary', fontStyle: 'italic' }}
                        >
                          Pending Registration
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {profile.email}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={hasProfileAccess(profile) ? profile.status : 'inactive'}
                  size="small"
                  color={hasProfileAccess(profile) && profile.status === 'active' ? 'success' : 'default'}
                  variant={hasProfileAccess(profile) && profile.status === 'active' ? 'filled' : 'outlined'}
                  sx={styles.statusChip}
                />
              </TableCell>
              <TableCell>
                <Tooltip
                  title={
                    profile.access_expires_at
                      ? format(new Date(profile.access_expires_at), 'dd/MM/yyyy HH:mm')
                      : 'Never'
                  }
                >
                  <span>{formatAccessExpiry(profile.access_expires_at)}</span>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Switch
                  size="small"
                  checked={profile.settings}
                  onChange={() => handleToggle(profile.email, 'settings', profile.settings)}
                  sx={styles.permissionToggle}
                />
              </TableCell>
              <TableCell align="center">
                <Switch
                  size="small"
                  checked={profile.analytics}
                  onChange={() => handleToggle(profile.email, 'analytics', profile.analytics)}
                  sx={styles.permissionToggle}
                />
              </TableCell>
              <TableCell align="center">
                <Switch
                  size="small"
                  checked={profile.authorisation}
                  onChange={() => handleToggle(profile.email, 'authorisation', profile.authorisation)}
                  sx={styles.permissionToggle}
                />
              </TableCell>
              <TableCell align="right">{renderActions(profile)}</TableCell>
            </TableRow>
          ))}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No users found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderHexForgeMobileView = () => (
    <Stack spacing={2}>
      {hexForgeProfiles.map((profile) => (
        <Card key={profile.email} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={profile.profile_url || undefined}
                alt={profile.full_name || ''}
                imgProps={{ referrerPolicy: 'no-referrer' }}
              >
                {(profile.full_name || profile.email)[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                  {profile.full_name ||
                    (profile.status === 'active' ? 'Unknown Name' : 'Pending Registration')}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {profile.email}
                </Typography>
              </Box>
              <Chip
                label={profile.status}
                size="small"
                color={profile.status === 'active' ? 'success' : 'default'}
                variant={profile.status === 'active' ? 'filled' : 'outlined'}
              />
            </Box>
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 2, px: 2 }}>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteHexForgeUser(profile.email)}
            >
              Remove User
            </Button>
          </CardActions>
        </Card>
      ))}
      {hexForgeProfiles.length === 0 && (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No 3D printing users found
        </Typography>
      )}
    </Stack>
  );

  const renderHexForgeDesktopView = () => (
    <TableContainer component={Paper} elevation={0} sx={styles.tableContainer}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {hexForgeProfiles.map((profile) => (
            <TableRow key={profile.email} hover>
              <TableCell>
                <Box sx={styles.userCell}>
                  {profile.status === 'active' ? (
                    <>
                      <Avatar
                        src={profile.profile_url || undefined}
                        alt={profile.full_name || ''}
                        imgProps={{ referrerPolicy: 'no-referrer' }}
                        sx={styles.avatar}
                      >
                        {(profile.full_name || profile.email)[0].toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {profile.full_name || 'Unknown Name'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {profile.email}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Avatar sx={styles.avatar}>?</Avatar>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: 'text.secondary', fontStyle: 'italic' }}
                        >
                          Pending Registration
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {profile.email}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={profile.status}
                  size="small"
                  color={profile.status === 'active' ? 'success' : 'default'}
                  variant={profile.status === 'active' ? 'filled' : 'outlined'}
                  sx={styles.statusChip}
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Delete 3D printing user">
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleDeleteHexForgeUser(profile.email)}
                    sx={styles.actionButton}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {!hexForgeLoading && hexForgeProfiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No 3D printing users found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
  return {
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
  };
}
