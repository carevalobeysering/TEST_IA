import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { MAX_DISCOUNTED_PURCHASES_PER_30_DAYS, RESCUE_TRIGGER_DAY } from '@mounjaro/shared';

import { formatDate } from '../../app/formatters';
import { useAuthStore } from '../auth/auth.store';

export function DashboardPage() {
  const patient = useAuthStore((state) => state.patient);
  const programState = useAuthStore((state) => state.programState);
  const purchaseHistory = useAuthStore((state) => state.purchaseHistory);
  const dashboardLoading = useAuthStore((state) => state.dashboardLoading);
  const errorMessage = useAuthStore((state) => state.errorMessage);

  if (!patient) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Dashboard principal</Typography>
            <Typography color="text.secondary">
              Inicia sesion con un paciente para consultar su estado real del programa.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      title: 'Estado actual',
      value: programState ? programState.state.toUpperCase() : 'Sin datos',
      description: programState?.statusMessage ?? 'Estado pendiente de carga.',
    },
    {
      title: 'Proximo beneficio',
      value: programState?.nextBenefit ?? 'Sin beneficio calculado',
      description: 'Calculado desde el backend segun el estado actual del paciente.',
    },
    {
      title: 'Limite movil',
      value: `${MAX_DISCOUNTED_PURCHASES_PER_30_DAYS} plumas`,
      description: 'Maximo de plumas con descuento por 30 dias moviles.',
    },
    {
      title: 'Rescate',
      value: programState?.rescueActive ? 'Activo' : `Dia ${RESCUE_TRIGGER_DAY}`,
      description: programState?.rescueWindowEndsAt
        ? `Vence ${formatDate(programState.rescueWindowEndsAt)}.`
        : 'Se activa si no hay recompra valida antes del umbral.',
    },
  ];

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Dashboard principal</Typography>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      {dashboardLoading ? <LinearProgress sx={{ height: 8, borderRadius: 999 }} /> : null}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        {cards.map((card) => (
          <Box key={card.title}>
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="overline" color="primary">
                    {card.title}
                  </Typography>
                  <Typography variant="h5">{card.value}</Typography>
                  <Typography color="text.secondary">{card.description}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Resumen del paciente</Typography>
              <Chip label={`Nivel ${programState?.currentLevel ?? patient.currentLevel}`} color="primary" />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(((programState?.validPurchaseCount ?? 0) / 4) * 100, 100)}
              sx={{ height: 10, borderRadius: 999 }}
            />
            <Typography color="text.secondary">
              {programState?.statusMessage ?? 'Sin estado disponible.'}
            </Typography>
            <Typography color="text.secondary">
              Ultima compra valida: {formatDate(programState?.lastValidPurchaseDate ?? null)}.
            </Typography>
            <Typography color="text.secondary">
              Compras registradas: {purchaseHistory.length}.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}