import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { formatCurrency, formatProgramType } from '../../app/formatters';
import { useAuthStore } from '../auth/auth.store';

const doses = ['2.5 mg', '5 mg', '7.5 mg', '10 mg'];

export function SimulatorPage() {
  const [dose, setDose] = useState(doses[0]);
  const [purchaseDate, setPurchaseDate] = useState('2026-04-01');
  const [listPrice, setListPrice] = useState('3500');
  const [quantity, setQuantity] = useState('1');
  const [isFree, setIsFree] = useState(false);
  const patient = useAuthStore((state) => state.patient);
  const simulationResult = useAuthStore((state) => state.simulationResult);
  const simulationLoading = useAuthStore((state) => state.simulationLoading);
  const registerLoading = useAuthStore((state) => state.registerLoading);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const runSimulation = useAuthStore((state) => state.simulatePurchase);
  const registerPurchase = useAuthStore((state) => state.registerPurchase);
  const clearSimulation = useAuthStore((state) => state.clearSimulation);

  async function handleSimulate() {
    await runSimulation({
      purchaseDate: new Date(`${purchaseDate}T10:00:00.000Z`).toISOString(),
      dose,
      listPrice: Number(listPrice),
      quantity: Number(quantity),
      isFree,
      isValid: true,
    });
  }

  async function handleRegister() {
    await registerPurchase({
      purchaseDate: new Date(`${purchaseDate}T10:00:00.000Z`).toISOString(),
      dose,
      listPrice: Number(listPrice),
      quantity: Number(quantity),
      isFree,
      isValid: true,
    });
    clearSimulation();
  }

  if (!patient) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            Inicia sesion con un paciente para usar el simulador y registrar compras.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Simulador de compra</Typography>
            <Typography color="text.secondary">
              Simula una compra sin persistirla y luego decide si quieres registrarla.
            </Typography>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            <TextField
              select
              label="Dosis"
              value={dose}
              onChange={(event) => setDose(event.target.value)}
            >
              {doses.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Fecha de compra"
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Precio de lista"
              value={listPrice}
              onChange={(event) => setListPrice(event.target.value)}
            />
            <TextField
              label="Cantidad de plumas"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={isFree}
                  onChange={(event) => setIsFree(event.target.checked)}
                />
              }
              label="Compra gratuita"
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Button variant="contained" onClick={handleSimulate} disabled={simulationLoading || registerLoading}>
                {simulationLoading ? 'Calculando...' : 'Calcular descuento'}
              </Button>
              <Button variant="outlined" onClick={handleRegister} disabled={registerLoading || simulationLoading}>
                {registerLoading ? 'Registrando...' : 'Registrar compra'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {simulationResult ? (
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="h6">Resultado de simulacion</Typography>
              <Typography color="text.secondary">
                Tipo aplicado: {formatProgramType(simulationResult.programTypeApplied)}
              </Typography>
              <Typography color="text.secondary">
                Descuento: {simulationResult.discount.percentage}% • {formatCurrency(simulationResult.discount.amount)}
              </Typography>
              <Typography color="text.secondary">
                Precio final: {formatCurrency(simulationResult.discount.finalPrice)}
              </Typography>
              <Typography color="text.secondary">
                Nivel resultante: {simulationResult.programState.currentLevel} • Estado: {simulationResult.programState.state}
              </Typography>
              <Typography color="text.secondary">
                {simulationResult.reasons.join(' ')}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
}