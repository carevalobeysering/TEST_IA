import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from './auth.store';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('PAC-0001');
  const [name, setName] = useState('Paciente Demo');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const authLoading = useAuthStore((state) => state.authLoading);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);

  async function handleLogin() {
    await login({ identifier, name });

    if (useAuthStore.getState().patient) {
      navigate('/');
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5">Acceso del paciente</Typography>
          <Typography color="text.secondary">
            Si el paciente no existe todavia, se crea en el backend con el nombre capturado.
          </Typography>
          {errorMessage ? <Alert severity="error" onClose={clearError}>{errorMessage}</Alert> : null}
          <TextField
            label="Identificador unico"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
          <TextField
            label="Nombre del paciente"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button variant="contained" onClick={handleLogin} disabled={authLoading}>
            {authLoading ? 'Cargando...' : 'Ingresar'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}