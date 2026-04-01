import { Alert, Card, CardContent, Chip, Stack, Typography } from '@mui/material';

import { formatCurrency, formatDate, formatProgramType } from '../../app/formatters';
import { useAuthStore } from '../auth/auth.store';

export function HistoryPage() {
  const patient = useAuthStore((state) => state.patient);
  const purchaseHistory = useAuthStore((state) => state.purchaseHistory);
  const errorMessage = useAuthStore((state) => state.errorMessage);

  if (!patient) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            Inicia sesion con un paciente para consultar su historial de compras.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Historial de compras</Typography>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      {purchaseHistory.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              Aun no hay compras registradas para este paciente.
            </Typography>
          </CardContent>
        </Card>
      ) : null}
      {purchaseHistory.map((purchase) => (
        <Card key={purchase.id}>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{formatDate(purchase.purchaseDate)}</Typography>
                <Chip label={formatProgramType(purchase.programTypeApplied)} color="secondary" variant="outlined" />
              </Stack>
              <Typography color="text.secondary">
                {purchase.dose} • {purchase.quantity} pluma(s)
              </Typography>
              <Typography color="text.secondary">
                Precio lista: {formatCurrency(purchase.listPrice)} • Final: {formatCurrency(purchase.finalPrice)}
              </Typography>
              <Typography color="text.secondary">
                Descuento aplicado: {formatCurrency(purchase.discountApplied)} • {purchase.isValid ? 'Compra valida' : 'No suma al programa'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}