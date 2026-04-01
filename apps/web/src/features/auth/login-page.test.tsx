import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { resetAuthStore, useAuthStore } from './auth.store';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  beforeEach(() => {
    resetAuthStore();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows an error when creating a missing patient without a name', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/patients?identifier=PAC-0001')) {
        return new Response(JSON.stringify(null), { status: 200 });
      }

      throw new Error(`Unhandled fetch call: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Nombre del paciente/i), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Ingresa el nombre del paciente para crear su acceso/i),
      ).toBeInTheDocument();
    });

    expect(useAuthStore.getState().patient).toBeNull();
  });
});