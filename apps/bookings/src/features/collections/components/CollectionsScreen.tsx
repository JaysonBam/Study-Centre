import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import CollectionEmailPreviewDialog from './CollectionEmailPreviewDialog';
import {
  printTone,
  formatMoney,
  getSavedReceipt,
  projectNeedsReceipt,
  collectionStatusLabel,
} from '../model/collectionsModel';
import { BoardSection, InfoBlock, PartRow } from './CollectionBoard';
import { useCollections } from '../hooks/useCollections';

export default function CollectionsPage() {
  const {
    theme,
    scanInputRef,
    boardLoading,
    boardError,
    query,
    setQuery,
    matches,
    setMatches,
    searching,
    activeProjectCode,
    project,
    projectLoading,
    receiptDraft,
    setReceiptDraft,
    receiptSaving,
    collectorName,
    setCollectorName,
    collectedByStudentNumber,
    setCollectedByStudentNumber,
    collectingPartIds,
    pendingCollectionPartIds,
    setPendingCollectionPartIds,
    imagePreviewPart,
    setImagePreviewPart,
    releaseItem,
    setReleaseItem,
    releaseLabel,
    setReleaseLabel,
    releasing,
    emailingCodes,
    emailPreview,
    setEmailPreview,
    snackbar,
    setSnackbar,
    showToast,
    loadBoard,
    openProject,
    runSearch,
    closeProject,
    handleSaveReceipt,
    requestCollectionConfirmation,
    confirmCollection,
    openRelease,
    confirmRelease,
    openEmail,
    helpDeskItems,
    partiallyReadyItems,
    collectableParts,
    partStatusSummary,
    pendingCollectionParts,
    collectionBlocked,
    savedReceipt,
  } = useCollections();
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1, md: 3 }, pt: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography color="text.secondary">
                  Scan or search without hiding the projects currently expected at the desk.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  inputRef={scanInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void runSearch();
                  }}
                  placeholder="Scan project code or student card, or search"
                  fullWidth
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <QrCodeScannerIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={searching ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                  onClick={() => void runSearch()}
                  disabled={searching || projectLoading}
                  sx={{ minHeight: 56, px: 3, whiteSpace: 'nowrap' }}
                >
                  {searching ? 'Searching HexForge' : 'Search'}
                </Button>
              </Stack>
              {boardError && (
                <Alert
                  severity="error"
                  variant="outlined"
                  action={
                    <Button color="inherit" size="small" onClick={() => void loadBoard()}>
                      Try again
                    </Button>
                  }
                >
                  {boardError}
                </Alert>
              )}
            </Stack>
          </Paper>

          {matches.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Choose a project
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    More than one project matched this search.
                  </Typography>
                </Box>
                <IconButton aria-label="Close search results" onClick={() => setMatches([])}>
                  <CloseIcon />
                </IconButton>
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1,
                }}
              >
                {matches.map((item) => (
                  <Button
                    key={item.project_code}
                    variant="outlined"
                    onClick={() => void openProject(item.project_code)}
                    sx={{ justifyContent: 'space-between', minHeight: 72, textAlign: 'left', gap: 2 }}
                  >
                    <Box>
                      <Typography fontWeight={900}>{item.project_code}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.student_name} · {item.student_number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.print_label || 'No collection label'}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={
                        item.group === 'help_desk'
                          ? 'Help desk'
                          : item.group === 'partially_ready'
                            ? 'Partially ready'
                            : 'Active'
                      }
                    />
                  </Button>
                ))}
              </Box>
            </Paper>
          )}

          {boardLoading ? (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
              <CircularProgress />
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Loading the collection board
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={4}>
              <BoardSection
                title="At help desk"
                count={helpDeskItems.length}
                tone="success"
                items={helpDeskItems}
                emailingCodes={emailingCodes}
                onOpen={openProject}
                onEmail={openEmail}
              />
              <BoardSection
                title="Partially ready"
                count={partiallyReadyItems.length}
                tone="primary"
                items={partiallyReadyItems}
                emailingCodes={emailingCodes}
                onOpen={openProject}
                onEmail={openEmail}
                onRelease={openRelease}
              />
            </Stack>
          )}
        </Stack>
      </Container>

      <Dialog
        open={Boolean(activeProjectCode)}
        onClose={closeProject}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: {
            position: 'relative',
            height: { xs: '96vh', md: '92vh' },
            maxHeight: '96vh',
            borderRadius: { xs: 1, md: 2 },
          },
        }}
        BackdropProps={{ sx: { bgcolor: alpha(theme.palette.common.black, 0.68) } }}
      >
        <DialogTitle
          component="div"
          sx={{
            minHeight: 56,
            p: { xs: 1, md: 1.5 },
            display: 'flex',
            justifyContent: 'flex-end',
            bgcolor: 'background.default',
          }}
        >
          <IconButton aria-label="Close collection workspace" onClick={closeProject}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{ px: { xs: 1.5, md: 3 }, pb: { xs: 1.5, md: 3 }, pt: 0, bgcolor: 'background.default' }}
        >
          {projectLoading && (
            <Box sx={{ minHeight: 320, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <Box>
                <CircularProgress />
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Loading collection details
                </Typography>
              </Box>
            </Box>
          )}
          {!projectLoading && project && (
            <Stack spacing={2.5}>
              <Box sx={{ px: { xs: 1, md: 2 }, pb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight={800}>
                      Project
                    </Typography>
                    <Typography variant="h4" component="h2" fontWeight={900}>
                      {project.project_code}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
                      gap: 2,
                    }}
                  >
                    <InfoBlock
                      label="Student"
                      value={project.collection?.student_name || 'Unavailable'}
                      detail={project.collection?.student_number}
                    />
                    <InfoBlock
                      label="Location label"
                      value={project.collection?.print_label || 'No collection label assigned'}
                    />
                    <InfoBlock
                      label="Course"
                      value={project.course || 'Not set'}
                      detail={project.lecturer || undefined}
                    />
                    <InfoBlock
                      label="Total"
                      value={formatMoney(project.cost_total, project.currency)}
                      detail={`${project.part_summary.total_parts} parts`}
                    />
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ px: { xs: 1, md: 2 } }}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={800}>
                    Collection details
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, minmax(0, 1fr))',
                        lg: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr)',
                      },
                      gap: 2,
                      alignItems: 'end',
                    }}
                  >
                    <TextField
                      label="Assisted by"
                      value={collectorName}
                      onChange={(event) => setCollectorName(event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Collected by student number"
                      value={collectedByStudentNumber}
                      onChange={(event) =>
                        setCollectedByStudentNumber(event.target.value.replace(/\D/g, '').slice(0, 8))
                      }
                      inputProps={{ inputMode: 'numeric', maxLength: 8 }}
                      fullWidth
                    />
                    {projectNeedsReceipt(project) && (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          label="Receipt number"
                          value={receiptDraft}
                          onChange={(event) => setReceiptDraft(event.target.value)}
                          fullWidth
                          color={collectionBlocked ? 'warning' : 'primary'}
                        />
                        <Button
                          variant="contained"
                          startIcon={
                            receiptSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />
                          }
                          onClick={() => void handleSaveReceipt()}
                          disabled={receiptSaving || !receiptDraft.trim()}
                          sx={{ minHeight: 56, whiteSpace: 'nowrap' }}
                        >
                          Save receipt
                        </Button>
                      </Stack>
                    )}
                  </Box>
                  {projectNeedsReceipt(project) ? (
                    <Alert severity={collectionBlocked ? 'warning' : 'success'} variant="outlined">
                      {collectionBlocked
                        ? 'Payment is required. Save the receipt number before collecting any parts.'
                        : `Receipt ${savedReceipt} is saved. Collection is enabled.`}
                    </Alert>
                  ) : (
                    <Alert severity="success" variant="outlined">
                      No receipt is required for this project.
                    </Alert>
                  )}
                </Stack>
              </Box>

              <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', md: 'center' }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        Parts for collection
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<DoneAllIcon />}
                      onClick={() =>
                        requestCollectionConfirmation(collectableParts.map((part) => part.part_id))
                      }
                      disabled={
                        collectableParts.length === 0 || collectionBlocked || collectingPartIds.length > 0
                      }
                      sx={{ minHeight: 44 }}
                    >
                      Review collection of {collectableParts.length} ready parts
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip size="small" label={`Total ${partStatusSummary.shown}`} variant="outlined" />
                    <Chip size="small" label={`Ready to collect ${partStatusSummary.ready}`} color="info" />
                    <Chip size="small" label={`Collected ${partStatusSummary.collected}`} color="success" />
                    <Chip size="small" label={`Not ready ${partStatusSummary.notReady}`} variant="outlined" />
                  </Stack>
                </Stack>
                <Stack spacing={1.5}>
                  {project.parts.length === 0 ? (
                    <Box
                      sx={{
                        py: 5,
                        textAlign: 'center',
                        border: `1px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                      }}
                    >
                      <Typography fontWeight={800}>No parts found for this project.</Typography>
                    </Box>
                  ) : (
                    project.parts.map((part) => (
                      <PartRow
                        key={part.part_id}
                        part={part}
                        currency={project.currency}
                        disabled={collectionBlocked || collectingPartIds.length > 0}
                        collecting={collectingPartIds.includes(part.part_id)}
                        onCollect={() => requestCollectionConfirmation([part.part_id])}
                        onPreview={() => setImagePreviewPart(part)}
                      />
                    ))
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(releaseItem)}
        onClose={releasing ? undefined : () => setReleaseItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Move {releaseItem?.project_code} to the help desk</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info" variant="outlined">
              All {releaseItem?.total_parts || 0} parts are complete. This releases the project using
              HexForge’s existing collection transition.
            </Alert>
            <TextField
              autoFocus
              label="Tray / location label (optional)"
              value={releaseLabel}
              onChange={(event) => setReleaseLabel(event.target.value)}
              placeholder="Tray A1"
              helperText="Leave this empty to keep the current label unchanged."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setReleaseItem(null)} disabled={releasing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={
              releasing ? <CircularProgress size={16} color="inherit" /> : <MoveToInboxOutlinedIcon />
            }
            onClick={() => void confirmRelease()}
            disabled={releasing}
          >
            {releasing ? 'Moving' : 'Move to help desk'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={pendingCollectionPartIds.length > 0}
        onClose={collectingPartIds.length > 0 ? undefined : () => setPendingCollectionPartIds([])}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm part collection</DialogTitle>
        <DialogContent dividers>
          {project && (
            <Stack spacing={2}>
              <Typography color="text.secondary">
                This will mark the listed parts as collected in HexForge.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.5,
                }}
              >
                <InfoBlock label="Project" value={project.project_code} />
                <InfoBlock
                  label="Collection location"
                  value={project.collection?.print_label || 'No collection label assigned'}
                />
                <InfoBlock
                  label="Student"
                  value={project.collection?.student_name || 'Unavailable'}
                  detail={project.collection?.student_number}
                />
                <InfoBlock label="Collected by" value={collectedByStudentNumber} />
                <InfoBlock label="Assisted by" value={collectorName} />
                <InfoBlock
                  label="Receipt status"
                  value={
                    projectNeedsReceipt(project)
                      ? getSavedReceipt(project)
                        ? `Receipt ${getSavedReceipt(project)} saved`
                        : 'Receipt required'
                      : 'No receipt required'
                  }
                />
              </Box>
              <Typography fontWeight={800}>
                {pendingCollectionParts.length} part{pendingCollectionParts.length === 1 ? '' : 's'} selected
                for collection
              </Typography>
              <Stack spacing={1}>
                {pendingCollectionParts.map((part) => (
                  <Paper
                    key={part.part_id}
                    variant="outlined"
                    sx={{
                      p: 1,
                      display: 'grid',
                      gridTemplateColumns: '56px minmax(0, 1fr)',
                      gap: 1.25,
                      alignItems: 'center',
                    }}
                  >
                    {part.thumbnail_url ? (
                      <Box
                        component="img"
                        src={part.thumbnail_url}
                        alt={`${part.part_name} thumbnail`}
                        sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 1,
                          bgcolor: 'action.hover',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          No image
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800}>
                        #{part.part_number} · {part.part_name}
                      </Typography>
                      <Chip
                        size="small"
                        label={collectionStatusLabel(part)}
                        color={printTone(part.print_status)}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPendingCollectionPartIds([])} disabled={collectingPartIds.length > 0}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => void confirmCollection()}
            disabled={collectingPartIds.length > 0 || pendingCollectionPartIds.length === 0}
          >
            {collectingPartIds.length > 0 ? 'Collecting…' : 'Confirm collection'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(imagePreviewPart)}
        onClose={() => setImagePreviewPart(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 7 }}>
          {imagePreviewPart?.part_name} · #{imagePreviewPart?.part_number}
          <IconButton
            aria-label="Close image preview"
            onClick={() => setImagePreviewPart(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {imagePreviewPart?.thumbnail_url && (
            <Box
              component="img"
              src={imagePreviewPart.thumbnail_url}
              alt={`${imagePreviewPart.part_name} preview`}
              sx={{
                display: 'block',
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <CollectionEmailPreviewDialog
        data={emailPreview}
        onClose={() => setEmailPreview(null)}
        onNotify={showToast}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
