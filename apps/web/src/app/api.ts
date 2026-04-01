export type PatientRecord = {
  id: string;
  name: string;
  uniqueIdentifier: string;
  registeredAt: string;
};

export type ProgramStateRecord = {
  patientId: string;
  validPurchaseCount: number;
  rescueActive: boolean;
  rescueActivatedAt: string | null;
  rescueWindowEndsAt: string | null;
  rescueStage: number | null;
  lastValidPurchaseDate: string | null;
  currentLevel: string;
  state: 'active' | 'rescue' | 'restarted';
  statusMessage: string;
  nextBenefit: string | null;
};

export type PurchaseRecord = {
  id: string;
  patientId: string;
  purchaseDate: string;
  dose: string;
  quantity: number;
  discountApplied: number | string;
  isValid: boolean;
  isFree: boolean;
  listPrice: number | string;
  finalPrice: number | string;
  programTypeApplied: string;
  createdAt: string;
};

export type PurchasePayload = {
  patientId: string;
  purchaseDate: string;
  dose: string;
  listPrice: number;
  quantity?: number;
  isFree?: boolean;
  isValid?: boolean;
};

export type SimulationResponse = {
  patientId: string;
  purchaseDate: string;
  quantity: number;
  discount: {
    percentage: number;
    amount: number;
    finalPrice: number;
  };
  programState: {
    validPurchaseCount: number;
    rescueActive: boolean;
    rescueActivatedAt: string | null;
    rescueStage: number | null;
    lastValidPurchaseDate: string | null;
    currentLevel: string;
    state: string;
  };
  programTypeApplied: string;
  isValidPurchase: boolean;
  countedForProgress: boolean;
  reasons: string[];
};

export type RegisterPurchaseResponse = {
  purchase: PurchaseRecord;
  programState: ProgramStateRecord;
  discount: {
    percentage: number;
    amount: number;
    finalPrice: number;
  };
  reasons: string[];
};

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = (configuredApiUrl || '/api').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function extractErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string | string[] };

    if (Array.isArray(payload.message)) {
      return payload.message.join(', ');
    }

    return payload.message ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export function findPatientByIdentifier(identifier: string) {
  return request<PatientRecord | null>(
    `/patients?identifier=${encodeURIComponent(identifier)}`,
  );
}

export function createPatient(input: {
  name: string;
  uniqueIdentifier: string;
}) {
  return request<PatientRecord>('/patients', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchProgramState(patientId: string) {
  return request<ProgramStateRecord>(`/program/patient/${patientId}`);
}

export function fetchPurchaseHistory(patientId: string) {
  return request<PurchaseRecord[]>(`/purchases/patient/${patientId}`);
}

export function simulatePurchase(input: PurchasePayload) {
  return request<SimulationResponse>('/purchases/simulate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function registerPurchase(input: PurchasePayload) {
  return request<RegisterPurchaseResponse>('/purchases', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}