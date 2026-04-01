import { render, screen } from '@testing-library/react';

import { resetAuthStore, useAuthStore } from '../auth/auth.store';
import { HistoryPage } from './history-page';

describe('HistoryPage', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('asks the user to sign in when there is no patient session', () => {
    render(<HistoryPage />);

    expect(
      screen.getByText(/Inicia sesion con un paciente para consultar su historial/i),
    ).toBeInTheDocument();
  });

  it('renders purchases from the store', () => {
    useAuthStore.setState({
      patient: {
        id: 'patient-1',
        name: 'Paciente Demo',
        uniqueIdentifier: 'PAC-0001',
        currentLevel: '2',
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

    render(<HistoryPage />);

    expect(screen.getByText(/Historial de compras/i)).toBeInTheDocument();
    expect(screen.getByText(/5 mg/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalonado/i)).toBeInTheDocument();
    expect(screen.getByText(/Compra valida/i)).toBeInTheDocument();
    expect(screen.getByText(/\$2,450.00/i)).toBeInTheDocument();
  });
});