import { useState } from 'react';
import { Box, Button, TextField, TableCell, TableRow, Checkbox } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export function NewRoomRow({ onCreate }: { onCreate: (payload: any) => Promise<void> }) {
  const [name, setName] = useState('');
  const [maxPeople, setMaxPeople] = useState<string>('');
  const [minPeople, setMinPeople] = useState<string>('');
  const [borrowable, setBorrowable] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await onCreate({
      name: name.trim(),
      max_people: maxPeople ? Number(maxPeople) : null,
      min_people: minPeople ? Number(minPeople) : null,
      borrowable_items: borrowable
        ? borrowable
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
      is_available: isAvailable,
    });
    setName('');
    setMaxPeople('');
    setMinPeople('');
    setBorrowable('');
    setIsAvailable(true);
  };

  return (
    <TableRow sx={{ bgcolor: 'action.hover' }}>
      <TableCell>
        <TextField
          placeholder="New Room Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          variant="outlined"
          fullWidth
        />
      </TableCell>
      <TableCell>
        <TextField
          type="number"
          placeholder="Max"
          value={maxPeople}
          onChange={(e) => setMaxPeople(e.target.value)}
          size="small"
          variant="outlined"
          fullWidth
        />
      </TableCell>
      <TableCell>
        <TextField
          type="number"
          placeholder="Min"
          value={minPeople}
          onChange={(e) => setMinPeople(e.target.value)}
          size="small"
          variant="outlined"
          fullWidth
        />
      </TableCell>
      <TableCell>
        <TextField
          placeholder="Items (comma separated)"
          value={borrowable}
          onChange={(e) => setBorrowable(e.target.value)}
          size="small"
          variant="outlined"
          fullWidth
        />
      </TableCell>
      <TableCell align="center">
        <Checkbox checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} size="small" />
      </TableCell>
      <TableCell align="right">
        <Button
          variant="contained"
          size="small"
          onClick={handleCreate}
          disabled={!name.trim()}
          sx={{ minWidth: 0, p: 1 }}
        >
          <AddIcon fontSize="small" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function NewCourseRow({ onCreate }: { onCreate: (name: string, color?: string) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), color);
      setName('');
      setColor('#000000');
    }
  };

  return (
    <TableRow sx={{ bgcolor: 'action.hover' }}>
      <TableCell>
        <TextField
          placeholder="New Course Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          variant="outlined"
          fullWidth
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              border: 'none',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
            }}
          />
        </Box>
      </TableCell>
      <TableCell align="right">
        <Button
          variant="contained"
          size="small"
          onClick={handleCreate}
          disabled={!name.trim()}
          sx={{ minWidth: 0, p: 1 }}
        >
          <AddIcon fontSize="small" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
