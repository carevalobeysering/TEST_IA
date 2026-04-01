import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { resetAuthStore } from '../features/auth/auth.store';
import { AppRouter } from './router';

describe('AppRouter', () => {
  beforeEach(() => {
    resetAuthStore();
    window.history.pushState({}, '', '/login');

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/patients?identifier=PAC-0001')) {
        return new Response(JSON.stringify(null), { status: 200 });
      }

      if (url.endsWith('/api/patients') && init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'patient-1',
            name: 'Paciente Demo',
            uniqueIdentifier: 'PAC-0001',
            registeredAt: '2026-04-01T10:00:00.000Z',
          }),
          { status: 201 },
        );
      }

      if (url.endsWith('/api/program/patient/patient-1')) {
        return new Response(
          JSON.stringify({
            patientId: 'patient-1',
            validPurchaseCount: 1,
            rescueActive: false,
            rescueActivatedAt: null,
            rescueWindowEndsAt: null,
            rescueStage: null,
            lastValidPurchaseDate: '2026-04-01T10:00:00.000Z',
            currentLevel: '1',
            state: 'active',
            statusMessage: 'El paciente mantiene continuidad dentro de la ventana vigente.',
            nextBenefit: '30% esperado en la siguiente compra valida.',
          }),
          { status: 200 },
        );
      }

      if (url.endsWith('/api/purchases/patient/patient-1')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }

      throw new Error(`Unhandled fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the dashboard shell headline', () => {
    render(<AppRouter />);

    expect(screen.getByText(/Seguimiento claro del descuento escalonado/i)).toBeInTheDocument();
  });

  it('creates or loads a patient session from the login flow', async () => {
    render(<AppRouter />);

    fireEvent.change(screen.getByLabelText(/Identificador unico/i), {
      target: { value: 'PAC-0001' },
    });
    fireEvent.change(screen.getByLabelText(/Nombre del paciente/i), {
      target: { value: 'Paciente Demo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/PAC-0001/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Paciente Demo/i)).toBeInTheDocument();
    expect(screen.getByText(/continuidad dentro de la ventana vigente/i)).toBeInTheDocument();
  });
});