import { render, screen } from '@testing-library/react';

import { resetAuthStore, useAuthStore } from '../auth/auth.store';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('asks the user to sign in when no patient session exists', () => {
    render(<DashboardPage />);

    expect(
      screen.getByText(/Inicia sesion con un paciente para consultar su estado real/i),
    ).toBeInTheDocument();
  });

  it('renders the backend program state summary from the store', () => {
    useAuthStore.setState({
      patient: {
        id: 'patient-1',
        name: 'Paciente Demo',
        uniqueIdentifier: 'PAC-0001',
        currentLevel: '2',
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
      purchaseHistory: [
        {
          id: 'purchase-1',
          patientId: 'patient-1',
          purchaseDate: '2026-04-01T10:00:00.000Z',
          dose: '5 mg',
          quantity: 1,
          discountApplied: 1050,
          isValid: true,
          isFree: false,
          listPrice: 3500,
          finalPrice: 2450,
          programTypeApplied: 'STANDARD',
          createdAt: '2026-04-01T10:00:00.000Z',
        },
      ],
    });

    render(<DashboardPage />);

    expect(screen.getByText(/Dashboard principal/i)).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText(/40% esperado en la siguiente compra valida/i)).toBeInTheDocument();
    expect(screen.getByText(/Ultima compra valida/i)).toBeInTheDocument();
    expect(screen.getByText(/Compras registradas: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Nivel 2/i)).toBeInTheDocument();
  });
});