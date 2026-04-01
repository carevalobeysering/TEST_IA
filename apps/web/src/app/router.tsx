import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import AlertRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Routes, Route, BrowserRouter, Link as RouterLink } from 'react-router-dom';

import { useAuthStore } from '../features/auth/auth.store';
import { LoginPage } from '../features/auth/login-page';
import { DashboardPage } from '../features/dashboard/dashboard-page';
import { HistoryPage } from '../features/history/history-page';
import { SimulatorPage } from '../features/simulator/simulator-page';
import { APP_VERSION } from './version';

function HomeShell() {
  const patient = useAuthStore((state) => state.patient);
  const programState = useAuthStore((state) => state.programState);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f7f9fc 0%, #eef5fb 100%)' }}>
      <AppBar elevation={0} color="transparent" position="static">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocalOfferRoundedIcon color="primary" />
            <Typography variant="h6" color="text.primary">
              Programa Mounjaro
            </Typography>
            <Chip
              label={APP_VERSION}
              size="small"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255,255,255,0.72)', fontWeight: 700 }}
            />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/" color="inherit">
              Dashboard
            </Button>
            <Button component={RouterLink} to="/login" color="inherit">
              Login
            </Button>
            <Button component={RouterLink} to="/historial" color="inherit">
              Historial
            </Button>
            <Button component={RouterLink} to="/simulador" color="inherit">
              Simulador
            </Button>
            {patient ? (
              <Button color="inherit" onClick={logout}>
                Salir
              </Button>
            ) : null}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 5 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 2fr) minmax(320px, 1fr)',
            },
          }}
        >
          <Box>
            <Card sx={{ overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #fff6ef 100%)' }}>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={2}>
                  <Chip label={patient ? 'Conectado al backend' : 'Listo para iniciar sesion'} color="primary" sx={{ width: 'fit-content' }} />
                  <Typography variant="h2" sx={{ fontSize: { xs: '2.25rem', md: '3.4rem' } }}>
                    Seguimiento claro del descuento escalonado del paciente.
                  </Typography>
                  <Typography color="text.secondary">
                    {patient
                      ? 'La UI ya consume el backend para mostrar estado, historial y simulacion real del programa.'
                      : 'Ingresa con un identificador de paciente para consultar su estado real o crearlo desde el portal.'}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Stack spacing={2}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <TimelineRoundedIcon color="secondary" />
                    <Typography variant="h6">Paciente activo</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {patient
                      ? `${patient.name} • ${patient.uniqueIdentifier} • Nivel ${programState?.currentLevel ?? patient.currentLevel}`
                      : 'Sin sesion iniciada'}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <AlertRoundedIcon color="warning" />
                    <Typography variant="h6">Siguiente foco</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {programState?.statusMessage ?? 'Conectar un paciente para mostrar mensajes reales del programa.'}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/historial" element={<HistoryPage />} />
            <Route path="/simulador" element={<SimulatorPage />} />
          </Routes>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary">
            Version visible: {APP_VERSION}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <HomeShell />
    </BrowserRouter>
  );
}