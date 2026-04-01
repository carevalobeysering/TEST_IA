/* eslint-disable prettier/prettier */
export type PatientRecord = {
  id: string;
  name: string;
  uniqueIdentifier: string;
  registeredAt: Date;
};

export type PurchaseRecord = {
  id: string;
  patientId: string;
  purchaseDate: Date;
  dose: string;
  quantity: number;
  discountApplied: number;
  isValid: boolean;
  isFree: boolean;
  listPrice: number;
  finalPrice: number;
  programTypeApplied: string;
  createdAt: Date;
};

export type ProgramStatusRecord = {
  patientId: string;
  validPurchaseCount: number;
  rescueActive: boolean;
  rescueActivatedAt: Date | null;
  rescueStage: number | null;
  lastValidPurchaseDate: Date | null;
  currentLevel: string;
  state: string;
  updatedAt: Date;
};