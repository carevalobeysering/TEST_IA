import { create } from 'zustand';

import {
  PatientRecord,
  ProgramStateRecord,
  PurchasePayload,
  PurchaseRecord,
  RegisterPurchaseResponse,
  SimulationResponse,
  createPatient,
  fetchProgramState,
  fetchPurchaseHistory,
  findPatientByIdentifier,
  registerPurchase,
  simulatePurchase,
} from '../../app/api';

type SessionPatient = {
  id: string;
  name: string;
  currentLevel: string;
  uniqueIdentifier: string;
};

type AuthState = {
  patient: SessionPatient | null;
  programState: ProgramStateRecord | null;
  purchaseHistory: PurchaseRecord[];
  simulationResult: SimulationResponse | null;
  authLoading: boolean;
  dashboardLoading: boolean;
  simulationLoading: boolean;
  registerLoading: boolean;
  errorMessage: string | null;
  login: (input: { identifier: string; name: string }) => Promise<void>;
  refreshPatientContext: () => Promise<void>;
  simulatePurchase: (input: Omit<PurchasePayload, 'patientId'>) => Promise<void>;
  registerPurchase: (input: Omit<PurchasePayload, 'patientId'>) => Promise<void>;
  clearError: () => void;
  clearSimulation: () => void;
  logout: () => void;
};

const initialState = {
  patient: null,
  programState: null,
  purchaseHistory: [],
  simulationResult: null,
  authLoading: false,
  dashboardLoading: false,
  simulationLoading: false,
  registerLoading: false,
  errorMessage: null,
};

function mapPatientRecord(
  patient: PatientRecord,
  programState: ProgramStateRecord | null,
): SessionPatient {
  return {
    id: patient.id,
    name: patient.name,
    uniqueIdentifier: patient.uniqueIdentifier,
    currentLevel: programState?.currentLevel ?? '1',
  };
}

async function fetchPatientContext(patientId: string) {
  const [programState, purchaseHistory] = await Promise.all([
    fetchProgramState(patientId),
    fetchPurchaseHistory(patientId),
  ]);

  return { programState, purchaseHistory };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,
  async login({ identifier, name }) {
    set({ authLoading: true, errorMessage: null });

    try {
      let patient = await findPatientByIdentifier(identifier.trim());

      if (!patient) {
        if (!name.trim()) {
          throw new Error('Ingresa el nombre del paciente para crear su acceso.');
        }

        patient = await createPatient({
          uniqueIdentifier: identifier.trim(),
          name: name.trim(),
        });
      }

      const { programState, purchaseHistory } = await fetchPatientContext(patient.id);

      set({
        authLoading: false,
        patient: mapPatientRecord(patient, programState),
        programState,
        purchaseHistory,
        simulationResult: null,
      });
    } catch (error) {
      set({
        authLoading: false,
        errorMessage:
          error instanceof Error ? error.message : 'No fue posible iniciar la sesion del paciente.',
      });
    }
  },
  async refreshPatientContext() {
    const patient = get().patient;

    if (!patient) {
      return;
    }

    set({ dashboardLoading: true, errorMessage: null });

    try {
      const { programState, purchaseHistory } = await fetchPatientContext(patient.id);

      set({
        dashboardLoading: false,
        patient: {
          ...patient,
          currentLevel: programState.currentLevel,
        },
        programState,
        purchaseHistory,
      });
    } catch (error) {
      set({
        dashboardLoading: false,
        errorMessage:
          error instanceof Error ? error.message : 'No fue posible actualizar el contexto del paciente.',
      });
    }
  },
  async simulatePurchase(input) {
    const patient = get().patient;

    if (!patient) {
      set({ errorMessage: 'Inicia sesion con un paciente antes de simular.' });
      return;
    }

    set({ simulationLoading: true, errorMessage: null });

    try {
      const simulationResult = await simulatePurchase({
        ...input,
        patientId: patient.id,
      });

      set({ simulationLoading: false, simulationResult });
    } catch (error) {
      set({
        simulationLoading: false,
        errorMessage:
          error instanceof Error ? error.message : 'No fue posible simular la compra.',
      });
    }
  },
  async registerPurchase(input) {
    const patient = get().patient;

    if (!patient) {
      set({ errorMessage: 'Inicia sesion con un paciente antes de registrar compras.' });
      return;
    }

    set({ registerLoading: true, errorMessage: null });

    try {
      const response: RegisterPurchaseResponse = await registerPurchase({
        ...input,
        patientId: patient.id,
      });

      const purchaseHistory = await fetchPurchaseHistory(patient.id);

      set({
        registerLoading: false,
        patient: {
          ...patient,
          currentLevel: response.programState.currentLevel,
        },
        programState: response.programState,
        purchaseHistory,
        simulationResult: null,
      });
    } catch (error) {
      set({
        registerLoading: false,
        errorMessage:
          error instanceof Error ? error.message : 'No fue posible registrar la compra.',
      });
    }
  },
  clearError() {
    set({ errorMessage: null });
  },
  clearSimulation() {
    set({ simulationResult: null });
  },
  logout() {
    set({ ...initialState });
  },
}));

export function resetAuthStore() {
  useAuthStore.setState({ ...initialState });
}