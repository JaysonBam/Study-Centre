import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Alert, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import PublicProjectView from '@/pages/project-status/ProjectStatusPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#315f72',
    },
    text: {
      primary: '#172033',
      secondary: '#5f6b7a',
    },
    background: {
      default: '#f3f5f4',
      paper: '#ffffff',
    },
    divider: '#dbe2ea',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: {
      fontWeight: 900,
      letterSpacing: 0,
      lineHeight: 1.08,
    },
    h5: {
      fontWeight: 850,
      letterSpacing: 0,
    },
    h6: {
      fontWeight: 820,
      letterSpacing: 0,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f3f5f4',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#e6ebf1',
        },
        bar: {
          backgroundColor: '#315f72',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/:projectId" element={<PublicProjectView />} />
          <Route path="/" element={<NoProjectFound />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function NoProjectFound() {
  return (
    <Box className="public-view-shell" display="flex" alignItems="center" justifyContent="center" px={2}>
      <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, backgroundColor: 'background.paper' }}>
        No valid project found. Please check your link.
      </Alert>
    </Box>
  );
}

export default App;
