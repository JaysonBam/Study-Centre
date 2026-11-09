import type { PublicPartDto } from '@/api/types';
import { usePublicProject } from '../hooks/usePublicProject';
import {
  milestones,
  getStatusPresentation,
  getPrintPresentation,
  formatMoney,
  formatDate,
  getPaymentText,
} from '../model/presentation';
import { FilamentBackdrop } from './FilamentBackdrop';
import { createFilamentPath, type FilamentGeometry } from '../model/filamentGeometry';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseIcon from '@mui/icons-material/Close';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  canShowCollectionBarcode,
  getIssuedQuoteDisplay,
  getProgressSummary,
} from '../model/publicViewRules';

function Surface({ children, sx = {} }: { children: ReactNode; sx?: Record<string, unknown> }) {
  return (
    <Card
      className="content-surface"
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: '#d8dfdd',
        borderRadius: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        boxShadow: '0 16px 42px rgba(23, 32, 51, 0.075)',
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}

function ProjectDetail({ label, value }: { label: string; value: string }) {
  return (
    <Box className="project-detail">
      <Typography component="dt">{label}</Typography>
      <Typography component="dd">{value}</Typography>
    </Box>
  );
}

export default function PublicProjectView() {
  const { projectId } = useParams();
  const { project, loading, errorType, fetchPublicProject } = usePublicProject(projectId);
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [barcodeMarkup, setBarcodeMarkup] = useState('');
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [filamentGeometry, setFilamentGeometry] = useState<FilamentGeometry | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const heroCopyRef = useRef<HTMLDivElement | null>(null);
  const heroMetaRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const canCollect = canShowCollectionBarcode(project?.state || '');
  const collectionCode = canCollect ? project?.collection_code || '' : '';

  useEffect(() => {
    let active = true;
    if (!barcodeDialogOpen || !collectionCode) {
      setBarcodeMarkup('');
      return () => {
        active = false;
      };
    }

    void import('jsbarcode').then(({ default: JsBarcode }) => {
      if (!active) return;
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(element, collectionCode, {
        format: 'CODE128',
        displayValue: true,
        width: 2,
        height: 96,
        margin: 16,
        fontSize: 18,
        fontOptions: 'bold',
        lineColor: '#111827',
        background: '#ffffff',
      });
      setBarcodeMarkup(element.outerHTML);
    });
    return () => {
      active = false;
    };
  }, [barcodeDialogOpen, collectionCode]);

  const quote = getIssuedQuoteDisplay(project?.quote_snapshot);
  const quoteCurrency = quote?.currency || project?.currency || 'ZAR';
  const status = useMemo(() => (project ? getStatusPresentation(project) : null), [project]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const logo = logoRef.current;
    const heroCopy = heroCopyRef.current;
    const heroMeta = heroMetaRef.current;
    if (!project || !shell || !logo || !heroCopy || !heroMeta) return;

    const measure = () => {
      const shellRect = shell.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const copyRect = heroCopy.getBoundingClientRect();
      const metaRect = heroMeta.getBoundingClientRect();
      const progressRect = progressRef.current?.getBoundingClientRect();
      if (logoRect.width === 0 || logoRect.height === 0) return;

      const width = Math.max(shell.clientWidth, shell.scrollWidth);
      const height = Math.max(shell.clientHeight, shell.scrollHeight);
      const startX = logoRect.left - shellRect.left + logoRect.width * 0.5;
      const startY = logoRect.top - shellRect.top + logoRect.height * 0.95;

      setFilamentGeometry({
        width,
        height,
        path: createFilamentPath(startX, startY, width, height),
        fades: [
          {
            x: copyRect.left - shellRect.left - 18,
            y: copyRect.top - shellRect.top - 14,
            width: copyRect.width + 36,
            height: copyRect.height + 28,
          },
          {
            x: metaRect.left - shellRect.left - 18,
            y: metaRect.top - shellRect.top - 12,
            width: metaRect.width + 36,
            height: metaRect.height + 24,
          },
          ...(progressRect
            ? [
                {
                  x: progressRect.left - shellRect.left - 12,
                  y: progressRect.top - shellRect.top - 10,
                  width: progressRect.width + 24,
                  height: progressRect.height + 20,
                },
              ]
            : []),
        ],
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    observer.observe(logo);
    observer.observe(heroCopy);
    observer.observe(heroMeta);
    if (progressRef.current) observer.observe(progressRef.current);
    window.addEventListener('resize', measure);
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [loading, project]);

  if (loading) {
    return (
      <Box className="public-view-shell" display="grid" sx={{ placeItems: 'center' }}>
        <Stack alignItems="center" spacing={1.5}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">Loading project status…</Typography>
        </Stack>
      </Box>
    );
  }

  if (!project) {
    const unavailable = errorType === 'service';
    return (
      <Box className="public-view-shell" display="grid" sx={{ placeItems: 'center', px: 2 }}>
        <Surface sx={{ width: '100%', maxWidth: 520 }}>
          <Stack spacing={2} sx={{ p: 3 }}>
            <Typography variant="h5">
              {unavailable ? 'Status temporarily unavailable' : 'Project not found'}
            </Typography>
            <Typography color="text.secondary">
              {unavailable
                ? 'We could not reach the project service. Please try again.'
                : 'Check that you opened the complete project link.'}
            </Typography>
            {unavailable && (
              <Button variant="contained" onClick={() => void fetchPublicProject()}>
                Try again
              </Button>
            )}
          </Stack>
        </Surface>
      </Box>
    );
  }

  const cancelled = project.state === 'CANCELLED';
  const closed = project.state === 'CLOSED';
  const paymentOutstanding =
    project.payment.needs_payment &&
    ['PAYMENT_REQUIRED', 'OVERRIDE_APPROVED'].includes(project.payment.payment_state_label);

  return (
    <Box ref={shellRef} className="public-view-shell">
      <FilamentBackdrop geometry={filamentGeometry} />
      <Container className="public-view-content" maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4.5 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(280px, 0.42fr) minmax(0, 1fr)' },
            gridTemplateAreas: {
              xs: '"hero" "collection" "cost" "parts"',
              md: '"hero hero" "collection collection" "cost parts"',
            },
            columnGap: { md: 2.5 },
            rowGap: { xs: 1.75, md: 2.25 },
            alignItems: 'start',
          }}
        >
          <Box className="status-hero" component="section" sx={{ gridArea: 'hero' }}>
            <Box ref={heroCopyRef} className="status-hero__copy">
              <Typography component="p" className="status-hero__eyebrow">
                Current project status
              </Typography>
              <Typography component="h1" className="status-hero__title">
                {status?.label}
              </Typography>
              <Typography className="status-hero__description">{status?.description}</Typography>
            </Box>
            <Box ref={logoRef} className="printer-mark">
              <Box
                component="img"
                className="printer-mark__image"
                src="/misc-printing-logo.svg"
                alt="MISC Printing"
              />
            </Box>
            <Box ref={heroMetaRef} className="hero-meta">
              <Box component="dl" className="project-details">
                <ProjectDetail label="Module" value={project.course || '3D printing request'} />
                <ProjectDetail label="Submitted" value={formatDate(project.created_at)} />
                <ProjectDetail label="Reference" value={project.project_code} />
              </Box>
              {project.lecturer && (
                <Typography className="status-hero__lecturer">Lecturer · {project.lecturer}</Typography>
              )}
            </Box>
            {!cancelled && (
              <Box ref={progressRef} className="hero-progress">
                <Typography variant="overline" color="text.secondary" fontWeight={850}>
                  Project progress
                </Typography>
                <Box sx={{ mt: 0.8 }}>
                  <ProgressTracker activeMilestone={status?.milestone || 0} complete={closed} />
                </Box>
              </Box>
            )}
          </Box>

          {canCollect && (
            <Surface
              sx={{
                gridArea: 'collection',
                borderColor: '#b9dfbe',
                backgroundColor: 'rgba(248, 252, 248, 0.88)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                spacing={2}
                sx={{ p: { xs: 2.25, sm: 2.5 } }}
              >
                <Box>
                  <Typography fontWeight={900}>
                    {project.state === 'PARTIALLY_COLLECTED'
                      ? 'Collection in progress'
                      : 'Ready for collection'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                    {project.state === 'PARTIALLY_COLLECTED'
                      ? 'Use this barcode when collecting the remaining available items.'
                      : 'Present the collection barcode at the MISC front desk.'}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<QrCodeScannerOutlinedIcon />}
                  onClick={() => setBarcodeDialogOpen(true)}
                >
                  Collection barcode
                </Button>
              </Stack>
            </Surface>
          )}

          <Surface sx={{ gridArea: 'cost', overflow: 'hidden', height: '100%' }}>
            <Box sx={{ height: 4, background: 'linear-gradient(90deg, #315f72, #75a6a3)' }} />
            <Box sx={{ p: { xs: 2.25, sm: 3 } }}>
              <Stack direction="column" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={800}>
                    Project cost
                  </Typography>
                  {quote ? (
                    <>
                      <Typography
                        sx={{ fontSize: { xs: '1.8rem', sm: '2.1rem' }, fontWeight: 900, lineHeight: 1.15 }}
                      >
                        {formatMoney(quote.total, quoteCurrency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                        Quote issued {formatDate(quote.issuedAt)}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="h6">Quote being prepared</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                        An amount will appear here once your quote is issued.
                      </Typography>
                    </>
                  )}
                </Box>
                <Box sx={{ maxWidth: 340 }}>
                  {!paymentOutstanding && (
                    <Typography variant="body2" color="text.secondary">
                      {getPaymentText(project)}
                    </Typography>
                  )}
                </Box>
              </Stack>
              {paymentOutstanding && !cancelled && (
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="flex-start"
                  sx={{
                    mt: 2.25,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 1.5,
                    color: '#7a4b0b',
                    backgroundColor: '#fff7e5',
                    border: '1px solid #f0d393',
                  }}
                >
                  <WarningAmberRoundedIcon sx={{ fontSize: 20, mt: 0.1, flex: '0 0 auto' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={800}>
                      Payment required
                    </Typography>
                    <Typography variant="body2">
                      Please settle payment before production can begin.
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
          </Surface>

          <Surface sx={{ gridArea: 'parts', height: '100%' }}>
            <Box sx={{ p: { xs: 2.25, sm: 3 } }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" component="h2">
                  {cancelled ? 'Project items' : 'Parts'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {project.parts.length} item{project.parts.length === 1 ? '' : 's'} ·{' '}
                  {getProgressSummary(project.part_summary.completed_parts, project.part_summary.total_parts)}
                </Typography>
              </Box>

              {project.parts.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', backgroundColor: '#f8fafb', borderRadius: 2 }}>
                  <Typography fontWeight={800}>No parts added yet</Typography>
                </Box>
              ) : (
                <Stack
                  sx={{
                    display: { lg: 'grid' },
                    gridTemplateColumns: { lg: 'repeat(2, minmax(0, 1fr))' },
                    columnGap: { lg: 0 },
                    '& > .part-row + .part-row': { borderTop: { xs: '1px solid #e3e8e7', lg: 0 } },
                    '& > .part-row': { px: { lg: 2.25 }, borderLeft: { lg: '1px solid #e3e8e7' } },
                    '& > .part-row:nth-of-type(2n+1)': { borderLeft: { lg: 0 }, pl: { lg: 0 } },
                    '& > .part-row:nth-of-type(2n)': { pr: { lg: 0 } },
                  }}
                >
                  {project.parts.map((part) => (
                    <PartRow
                      key={part.part_id}
                      part={part}
                      projectState={project.state}
                      cancelled={cancelled}
                      imageBroken={brokenImages.has(part.part_id)}
                      onImageError={() => setBrokenImages((current) => new Set(current).add(part.part_id))}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Surface>
        </Box>
      </Container>

      <Dialog
        open={barcodeDialogOpen && canCollect}
        onClose={() => setBarcodeDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2.5, m: 2 } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 850 }}>
          Collection barcode
          <IconButton
            aria-label="Close barcode"
            onClick={() => setBarcodeDialogOpen(false)}
            sx={{ position: 'absolute', right: 12, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center" sx={{ pb: 1 }}>
            <Box
              sx={{
                width: '100%',
                overflowX: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: '#fff',
                p: 1,
              }}
            >
              <Box
                aria-label={`Barcode for collection code ${collectionCode}`}
                sx={{
                  width: '100%',
                  maxWidth: 320,
                  mx: 'auto',
                  '& svg': { display: 'block', width: '100%', height: 'auto' },
                }}
                dangerouslySetInnerHTML={{ __html: barcodeMarkup }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Present this barcode at the MISC front desk so it can be scanned from your phone.
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function ProgressTracker({ activeMilestone, complete }: { activeMilestone: number; complete: boolean }) {
  return (
    <Box aria-label={`Project progress: ${milestones[Math.max(0, activeMilestone)]}`}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))`,
          alignItems: 'start',
        }}
      >
        {milestones.map((label, index) => {
          const reached = index <= activeMilestone;
          const done = complete || index < activeMilestone;
          return (
            <Box
              key={label}
              sx={{
                position: 'relative',
                textAlign: 'center',
                '&::before':
                  index === 0
                    ? undefined
                    : {
                        content: '""',
                        position: 'absolute',
                        height: 2,
                        top: 10,
                        right: '50%',
                        left: '-50%',
                        backgroundColor: reached ? 'primary.main' : '#dbe2e8',
                      },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  width: 21,
                  height: 21,
                  mx: 'auto',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: reached ? 'primary.main' : '#fff',
                  border: '2px solid',
                  borderColor: reached ? 'primary.main' : '#cbd4dc',
                  color: '#fff',
                }}
              >
                {done && <CheckRoundedIcon sx={{ fontSize: 14 }} />}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.7,
                  color: reached ? 'text.primary' : 'text.secondary',
                  fontWeight: reached ? 750 : 500,
                  fontSize: { xs: '0.63rem', sm: '0.75rem' },
                  lineHeight: 1.2,
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function PartRow({
  part,
  projectState,
  cancelled,
  imageBroken,
  onImageError,
}: {
  part: PublicPartDto;
  projectState: string;
  cancelled: boolean;
  imageBroken: boolean;
  onImageError: () => void;
}) {
  const tone = getPrintPresentation(projectState, part.print_status);
  const materials = [
    part.primary_material
      ? `${part.primary_material}${part.primary_brand ? ` (${part.primary_brand})` : ''}${part.primary_estimated_weight ? ` · ${part.primary_estimated_weight}g` : ''}`
      : '',
    part.secondary_material
      ? `${part.secondary_material}${part.secondary_brand ? ` (${part.secondary_brand})` : ''}${part.secondary_estimated_weight ? ` · ${part.secondary_estimated_weight}g` : ''}`
      : '',
  ].filter(Boolean);

  return (
    <Box
      className="part-row"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '88px minmax(0, 1fr)',
          sm: '92px minmax(0, 1fr) auto',
          md: '82px minmax(0, 1fr)',
        },
        gap: { xs: 1.5, sm: 2 },
        alignItems: 'center',
        py: 1.75,
      }}
    >
      <Box
        sx={{
          width: { xs: 88, sm: 92, md: 82 },
          height: { xs: 88, sm: 82 },
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: '#eef2f4',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {part.thumbnail_url && !imageBroken ? (
          <Box
            component="img"
            src={part.thumbnail_url}
            alt={`${part.part_name} thumbnail`}
            onError={onImageError}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Inventory2OutlinedIcon sx={{ color: 'text.disabled', fontSize: 30 }} />
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="baseline">
          <Typography fontWeight={850} sx={{ overflowWrap: 'anywhere' }}>
            {part.part_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            #{part.part_number}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.45 }}>
          {materials.length ? materials.join(' · ') : 'Material details not available'}
        </Typography>
        {!cancelled && part.printer_name && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
            Printer: {part.printer_name}
          </Typography>
        )}
        {!cancelled && (
          <Chip
            size="small"
            label={tone.label}
            sx={{
              display: { xs: 'inline-flex', sm: 'none', md: 'inline-flex' },
              mt: 0.9,
              height: 24,
              color: tone.color,
              backgroundColor: tone.background,
              fontWeight: 750,
            }}
          />
        )}
      </Box>
      {!cancelled && (
        <Chip
          size="small"
          label={tone.label}
          sx={{
            display: { xs: 'none', sm: 'inline-flex', md: 'none' },
            color: tone.color,
            backgroundColor: tone.background,
            fontWeight: 750,
          }}
        />
      )}
    </Box>
  );
}
