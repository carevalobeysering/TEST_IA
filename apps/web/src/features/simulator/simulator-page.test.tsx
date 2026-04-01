import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { resetAuthStore, useAuthStore } from '../auth/auth.store';
import { SimulatorPage } from './simulator-page';

describe('SimulatorPage', () => {
  beforeEach(() => {
    resetAuthStore();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the simulation result returned by the backend', async () => {
    useAuthStore.setState({
      patient: {
        id: 'patient-1',
        name: 'Paciente Demo',
        uniqueIdentifier: 'PAC-0001',
        currentLevel: '1',
      },
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith('/api/purchases/simulate')) {
        return new Response(
          JSON.stringify({
            patientId: 'patient-1',
            purchaseDate: '2026-04-01T10:00:00.000Z',
            quantity: 1,
            discount: {
              percentage: 30,
              amount: 1050,
              finalPrice: 2450,
            },
            programState: {
              validPurchaseCount: 2,
              rescueActive: false,
              rescueActivatedAt: null,
              rescueStage: null,
              lastValidPurchaseDate: '2026-04-01T10:00:00.000Z',
              currentLevel: '2',
              state: 'active',
            },
            programTypeApplied: 'STANDARD',
            isValidPurchase: true,
            countedForProgress: true,
            reasons: ['Compra valida dentro de la ventana vigente.'],
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unhandled fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<SimulatorPage />);

    fireEvent.click(screen.getByRole('button', { name: /Calcular descuento/i }));

    await waitFor(() => {
      expect(screen.getByText(/Resultado de simulacion/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Escalonado/i)).toBeInTheDocument();
    expect(screen.getByText(/30%/i)).toBeInTheDocument();
    expect(screen.getByText(/\$2,450.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Compra valida dentro de la ventana vigente/i)).toBeInTheDocument();
  });

  it('registers a purchase and refreshes store state', async () => {
    useAuthStore.setState({
      patient: {
        id: 'patient-1',
        name: 'Paciente Demo',
        uniqueIdentifier: 'PAC-0001',
        currentLevel: '1',
      },
      simulationResult: {
        patientId: 'patient-1',
        purchaseDate: '2026-04-01T10:00:00.000Z',
        quantity: 1,
        discount: {
          percentage: 30,
          amount: 1050,
          finalPrice: 2450,
        },
        programState: {
          validPurchaseCount: 2,
          rescueActive: false,
          rescueActivatedAt: null,
          rescueStage: null,
          lastValidPurchaseDate: '2026-04-01T10:00:00.000Z',
          currentLevel: '2',
          state: 'active',
        },
        programTypeApplied: 'STANDARD',
        isValidPurchase: true,
        countedForProgress: true,
        reasons: ['Compra valida dentro de la ventana vigente.'],
      },
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith('/api/purchases') && init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            purchase: {
              id: 'purchase-1',
              patientId: 'patient-1',
              purchaseDate: '2026-04-01T10:00:00.000Z',
              dose: '2.5 mg',
              quantity: 1,
              discountApplied: 1050,
              isValid: true,
              isFree: false,
              listPrice: 3500,
              finalPrice: 2450,
              programTypeApplied: 'STANDARD',
              createdAt: '2026-04-01T10:00:00.000Z',
            },
            programState: {
              patientId: 'patient-1',
              validPurchaseCount: 2,
              rescueActive: false,
              rescueActivatedAt: null,
              rescueWindowEndsAt: null,
              rescueStage: null,
              lastValidPurchaseDate: '2026-04-01T10:00:00.000Z',
              currentLevel: '2',
              state: 'active',
              statusMessage: 'El paciente mantiene continuidad dentro de la ventana vigente.',
              nextBenefit: '40% esperado en la siguiente compra valida.',
            },
            discount: {
              percentage: 30,
              amount: 1050,
              finalPrice: 2450,
            },
            reasons: ['Compra valida dentro de la ventana vigente.'],
          }),
          { status: 201 },
        );
      }

      if (url.endsWith('/api/purchases/patient/patient-1')) {
        return new Response(
          JSON.stringify([
            {
              id: 'purchase-1',
              patientId: 'patient-1',
              purchaseDate: '2026-04-01T10:00:00.000Z',
              dose: '2.5 mg',
              quantity: 1,
              discountApplied: 1050,
              isValid: true,
              isFree: false,
              listPrice: 3500,
              finalPrice: 2450,
              programTypeApplied: 'STANDARD',
              createdAt: '2026-04-01T10:00:00.000Z',
            },
          ]),
          { status: 200 },
        );
      }

      throw new Error(`Unhandled fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<SimulatorPage />);

    fireEvent.click(screen.getByRole('button', { name: /Registrar compra/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().purchaseHistory).toHaveLength(1);
    });

    expect(useAuthStore.getState().patient?.currentLevel).toBe('2');
    expect(useAuthStore.getState().simulationResult).toBeNull();
  });

  it('shows the backend error message when simulation fails', async () => {
    useAuthStore.setState({
      patient: {
        id: 'patient-1',
        name: 'Paciente Demo',
        uniqueIdentifier: 'PAC-0001',
        currentLevel: '1',
      },
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith('/api/purchases/simulate')) {
        return new Response(
          JSON.stringify({
            message: 'La compra excede el limite movil de descuento.',
          }),
          { status: 400 },
        );
      }

      throw new Error(`Unhandled fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<SimulatorPage />);

    fireEvent.click(screen.getByRole('button', { name: /Calcular descuento/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/La compra excede el limite movil de descuento/i),
      ).toBeInTheDocument();
    });

    expect(useAuthStore.getState().simulationResult).toBeNull();
  });
});