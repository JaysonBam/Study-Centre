import { Button, Box, Typography, IconButton, FormHelperText } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { DateInput } from '@/shared/ui/DateInput';
import { TimeInput } from '@/shared/ui/TimeInput';
import { type BookingRange } from '@/shared/lib/bookingEntry';

interface BookingRangeSectionProps {
  kind: 'date' | 'time';
  ranges: BookingRange[];
  errors: Record<string, string>;
  validationErrors: Record<string, string>;
  onAdd: () => void;
  onChange: (id: string, field: 'start' | 'end', value: string) => void;
  onRemove: (id: string, index: number) => void;
}

export function BookingRangeSection({
  kind,
  ranges,
  errors,
  validationErrors,
  onAdd,
  onChange,
  onRemove,
}: BookingRangeSectionProps) {
  const isDate = kind === 'date';
  const Input = isDate ? DateInput : TimeInput;
  const sectionError = errors[isDate ? 'bulkDates' : 'bulkTimes'];
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        {isDate ? 'Date ranges' : 'Time ranges'}
      </Typography>
      {ranges.map((range, index) => (
        <Box
          key={range.id}
          sx={{
            display: 'grid',
            gridTemplateColumns: isDate
              ? { xs: 'minmax(0, 1fr) auto', sm: 'minmax(0, 1fr) minmax(0, 1fr) auto' }
              : 'minmax(0, 1fr) minmax(0, 1fr) auto',
            gap: 1,
            mb: 2,
            alignItems: 'start',
          }}
        >
          {(['start', 'end'] as const).map((field) => {
            const label = `${field === 'start' ? 'Start' : 'End'} ${kind}`;
            const key = `${range.id}.${field}`;
            const message = errors[key] ? validationErrors[key] : undefined;
            return (
              <Input
                key={field}
                id={`${range.id}-${field}`}
                fullWidth
                size="small"
                label={label}
                sx={isDate ? { gridColumn: { xs: 1, sm: 'auto' } } : undefined}
                value={range[field]}
                inputProps={{ 'aria-label': `${label}, range ${index + 1}` }}
                onChange={(value) => onChange(range.id, field, value)}
                error={!!message}
                helperText={message}
              />
            );
          })}
          <IconButton
            aria-label={`Remove ${kind} range ${index + 1}`}
            onClick={() => onRemove(range.id, index)}
            sx={
              isDate
                ? { gridColumn: { xs: 2, sm: 'auto' }, gridRow: { xs: '1 / span 2', sm: 'auto' } }
                : undefined
            }
          >
            <CloseIcon />
          </IconButton>
        </Box>
      ))}
      <Button
        id={`add-${kind}-range`}
        aria-invalid={!!sectionError && !ranges.length}
        size="small"
        onClick={onAdd}
      >
        Add {kind} range
      </Button>
      {!ranges.length && sectionError && <FormHelperText error>{sectionError}</FormHelperText>}
    </>
  );
}
