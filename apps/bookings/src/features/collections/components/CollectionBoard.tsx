import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { type HexForgeCollectionBoardItem, type HexForgeCollectionPart } from '@/api/printingCollections';
import {
  printTone,
  formatMoney,
  canCollectPart,
  isCollectedPart,
  collectionStatusLabel,
} from '../model/collectionsModel';

export function BoardSection({
  title,
  count,
  tone,
  items,
  emailingCodes,
  onOpen,
  onEmail,
  onRelease,
}: {
  title: string;
  count: number;
  tone: 'success' | 'primary';
  items: HexForgeCollectionBoardItem[];
  emailingCodes: string[];
  onOpen: (projectCode: string) => void;
  onEmail: (item: HexForgeCollectionBoardItem) => void;
  onRelease?: (item: HexForgeCollectionBoardItem) => void;
}) {
  return (
    <Box component="section" aria-labelledby={`${tone}-collection-section`}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography id={`${tone}-collection-section`} variant="h5" fontWeight={900}>
              {title}
            </Typography>
            <Chip label={count} color={tone} size="small" />
          </Stack>
        </Box>
      </Stack>
      {items.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ py: 5, px: 2, textAlign: 'center', borderStyle: 'dashed', borderRadius: 2 }}
        >
          <Inventory2OutlinedIcon color="disabled" sx={{ fontSize: 36 }} />
          <Typography fontWeight={800} sx={{ mt: 1 }}>
            No projects in this section
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The board will place projects here when their print progress qualifies.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {items.map((item) => (
            <CollectionBoardCard
              key={item.project_code}
              item={item}
              emailing={emailingCodes.includes(item.project_code)}
              onOpen={() => onOpen(item.project_code)}
              onEmail={() => onEmail(item)}
              onRelease={onRelease ? () => onRelease(item) : undefined}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export function CollectionBoardCard({
  item,
  emailing,
  onOpen,
  onEmail,
  onRelease,
}: {
  item: HexForgeCollectionBoardItem;
  emailing: boolean;
  onOpen: () => void;
  onEmail: () => void;
  onRelease?: () => void;
}) {
  const isHelpDesk = item.group === 'help_desk';
  const progress = item.total_parts > 0 ? Math.round((item.completed_parts / item.total_parts) * 100) : 0;
  const statusLabel =
    item.state === 'PARTIALLY_COLLECTED'
      ? `${item.remaining_parts} part${item.remaining_parts === 1 ? '' : 's'} remaining`
      : isHelpDesk
        ? `${item.remaining_parts} part${item.remaining_parts === 1 ? '' : 's'} at desk`
        : `${item.completed_parts} of ${item.total_parts} printed`;

  return (
    <Paper
      variant="outlined"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        '&:hover, &:focus-visible': {
          borderColor: isHelpDesk ? 'success.main' : 'primary.main',
          boxShadow: 3,
          outline: 'none',
        },
        '@media (prefers-reduced-motion: no-preference)': {
          '&:hover': { transform: 'translateY(-2px)' },
          '&:hover .print-stack-image': { transform: 'rotate(-1deg) scale(1.02)' },
        },
      }}
    >
      <Stack spacing={1.75}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '104px minmax(0, 1fr)', gap: 2 }}>
          <Box sx={{ position: 'relative', width: 104, height: 104 }}>
            {item.total_parts > 1 && (
              <>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: '7px -5px -5px 7px',
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: '3px -2px -2px 3px',
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                />
              </>
            )}
            <Box
              className="print-stack-image"
              sx={{
                position: 'relative',
                width: 104,
                height: 104,
                borderRadius: 1.5,
                overflow: 'hidden',
                bgcolor: 'action.hover',
                display: 'grid',
                placeItems: 'center',
                transition: 'transform 180ms ease',
              }}
            >
              {item.thumbnail_url ? (
                <Box
                  component="img"
                  src={item.thumbnail_url}
                  alt={`${item.thumbnail_part_name || item.project_code} thumbnail`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Stack alignItems="center" spacing={0.5}>
                  <Inventory2OutlinedIcon color="disabled" />
                  <Typography variant="caption" color="text.secondary">
                    No image
                  </Typography>
                </Stack>
              )}
            </Box>
            {item.total_parts > 1 && (
              <Chip
                icon={<LayersOutlinedIcon />}
                label={item.total_parts}
                size="small"
                sx={{ position: 'absolute', right: -8, bottom: -8, fontWeight: 900 }}
              />
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={800}>
                  Reference code
                </Typography>
                <Typography variant="h5" fontWeight={900}>
                  {item.project_code}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  Priority #{item.priority_number}
                </Typography>
              </Box>
              <Chip
                size="small"
                color={isHelpDesk ? (item.state === 'PARTIALLY_COLLECTED' ? 'info' : 'success') : 'primary'}
                label={
                  isHelpDesk
                    ? item.state === 'PARTIALLY_COLLECTED'
                      ? 'Partially collected'
                      : 'At help desk'
                    : 'Partially ready'
                }
              />
            </Stack>
            <Typography fontWeight={800} noWrap title={item.student_name}>
              {item.student_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.student_number}
            </Typography>
            {isHelpDesk && (
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{ mt: 0.75, color: item.print_label ? 'success.dark' : 'warning.main' }}
              >
                <LocationOnOutlinedIcon fontSize="small" />
                <Typography variant="body2" fontWeight={800} noWrap>
                  {item.print_label || 'No location assigned'}
                </Typography>
              </Stack>
            )}
          </Box>
        </Box>
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="body2" fontWeight={800}>
              {statusLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress}% complete
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={isHelpDesk ? 'success' : 'primary'}
            sx={{ height: 7, borderRadius: 99 }}
          />
        </Box>
        {item.payment_outstanding && (
          <Alert severity="warning" variant="outlined" sx={{ py: 0 }}>
            <Typography variant="caption" fontWeight={800}>
              Payment still needs attention
            </Typography>
          </Alert>
        )}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Button variant="outlined" onClick={onOpen} fullWidth>
            Open details
          </Button>
          {isHelpDesk && (
            <Button
              variant="contained"
              color="success"
              startIcon={emailing ? <CircularProgress size={15} color="inherit" /> : <EmailOutlinedIcon />}
              onClick={onEmail}
              disabled={emailing}
              fullWidth
            >
              {emailing ? 'Preparing' : 'Show email detail'}
            </Button>
          )}
          {!isHelpDesk && item.all_parts_completed && onRelease && (
            <Button variant="contained" startIcon={<MoveToInboxOutlinedIcon />} onClick={onRelease} fullWidth>
              Move to help desk
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

export function InfoBlock({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={800}>
        {label}
      </Typography>
      <Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
      {detail && (
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {detail}
        </Typography>
      )}
    </Box>
  );
}

export function PartRow({
  part,
  currency,
  disabled,
  collecting,
  onCollect,
  onPreview,
}: {
  part: HexForgeCollectionPart;
  currency: string;
  disabled: boolean;
  collecting: boolean;
  onCollect: () => void;
  onPreview: () => void;
}) {
  const collected = isCollectedPart(part);
  const collectable = canCollectPart(part) && !collected;
  const hasMaterials = Boolean(part.primary_material || part.secondary_material);
  const hasIncompleteRecord = !part.thumbnail_url && !hasMaterials;
  const materials = [
    part.primary_material
      ? `${part.primary_material}${part.primary_brand ? ` (${part.primary_brand})` : ''}: ${part.primary_estimated_weight || 0}g`
      : '',
    part.secondary_material
      ? `${part.secondary_material}${part.secondary_brand ? ` (${part.secondary_brand})` : ''}: ${part.secondary_estimated_weight || 0}g`
      : '',
  ].filter(Boolean);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        display: 'grid',
        gridTemplateColumns: { xs: '72px minmax(0, 1fr)', md: '104px minmax(0, 1fr) auto' },
        gap: 1.5,
        alignItems: 'center',
        bgcolor: collected ? 'success.lighter' : 'background.paper',
      }}
    >
      <Box
        component={part.thumbnail_url ? 'button' : 'div'}
        type={part.thumbnail_url ? 'button' : undefined}
        onClick={part.thumbnail_url ? onPreview : undefined}
        aria-label={part.thumbnail_url ? `Preview image for ${part.part_name}` : undefined}
        sx={{
          width: { xs: 72, md: 104 },
          height: { xs: 72, md: 104 },
          p: 0,
          border: 0,
          cursor: part.thumbnail_url ? 'pointer' : 'default',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'action.hover',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {part.thumbnail_url ? (
          <Box
            component="img"
            src={part.thumbnail_url}
            alt={`${part.part_name} thumbnail`}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Stack spacing={0.25} alignItems="center">
            <Inventory2OutlinedIcon color="disabled" />
            <Typography variant="caption" color="text.secondary">
              No image
            </Typography>
          </Stack>
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <Typography fontWeight={900}>{part.part_name}</Typography>
          <Typography variant="caption" color="text.secondary">
            #{part.part_number}
          </Typography>
          <Chip size="small" label={collectionStatusLabel(part)} color={printTone(part.print_status)} />
          {hasIncompleteRecord && (
            <Chip size="small" label="Incomplete part record" color="warning" variant="outlined" />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {hasMaterials ? materials.join(' | ') : 'Material details unavailable'}
        </Typography>
        {part.collection?.special_instruction && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Note: {part.collection.special_instruction}
          </Typography>
        )}
        {collected && (
          <Typography
            variant="caption"
            color="success.dark"
            display="block"
            sx={{ mt: 0.5, fontWeight: 700 }}
          >
            Assisted by {part.collection?.collected_by || 'Unknown'}
            {part.collection?.collected_by_student_number
              ? ` · Collected by student ${part.collection.collected_by_student_number}`
              : ''}
          </Typography>
        )}
      </Box>
      <Stack
        spacing={1}
        alignItems={{ xs: 'stretch', md: 'flex-end' }}
        sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}
      >
        <Typography fontWeight={900}>{formatMoney(part.total_cost, currency)}</Typography>
        {collectable && (
          <Button
            variant="contained"
            color="success"
            startIcon={collecting ? <CircularProgress size={16} color="inherit" /> : <LocalShippingIcon />}
            onClick={onCollect}
            disabled={disabled || collecting}
          >
            {collecting ? 'Collecting' : 'Collect part'}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
