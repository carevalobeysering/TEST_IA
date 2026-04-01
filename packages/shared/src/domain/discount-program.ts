export const STANDARD_WINDOW_DAYS = 35;
export const RESET_WINDOW_START_DAY = 36;
export const RESET_WINDOW_END_DAY = 44;
export const RESCUE_TRIGGER_DAY = 45;
export const RESCUE_WINDOW_DAYS = 7;
export const MAX_DISCOUNTED_PURCHASES_PER_30_DAYS = 2;
export const SUPPORTED_DOSES = ['2.5 mg', '5 mg', '7.5 mg', '10 mg'] as const;
export const PURCHASE_PROGRAM_TYPES = ['standard', 'reset', 'rescue', 'full-price'] as const;
export const DEFAULT_LEVEL_DISCOUNT_PERCENTAGES = {
  '1': 25,
  '2': 30,
  '3': 35,
  '4': 40,
  '4+': 40,
} as const;
export const RESCUE_DISCOUNT_PERCENTAGE = 40;

export type ProgramState = 'active' | 'rescue' | 'restarted';

export type ProgramLevel = '1' | '2' | '3' | '4' | '4+';

export interface PurchaseSnapshot {
  id: string;
  patientId: string;
  purchaseDate: string;
  dose: (typeof SUPPORTED_DOSES)[number] | string;
  quantity: number;
  priceList: number;
  finalPrice: number;
  isFree: boolean;
  isValid: boolean;
  discountApplied: number;
  programType: (typeof PURCHASE_PROGRAM_TYPES)[number];
}

export interface PatientProgramState {
  patientId: string;
  validPurchaseCount: number;
  rescueActive: boolean;
  rescueActivatedAt: string | null;
  rescueWindowEndsAt?: string | null;
  rescueStage: number | null;
  lastValidPurchaseDate: string | null;
  currentLevel: ProgramLevel;
  state: ProgramState;
  statusMessage?: string;
  nextBenefit?: string | null;
}