import { DiscountEngineService } from '../discount-engine/discount-engine.service';
import { PatientsService } from '../patients/patients.service';
import { ProgramStateService } from '../program-state/program-state.service';
import { PurchasesRepository } from './purchases.repository';
import { PurchasesService } from './purchases.service';

describe('PurchasesService', () => {
  it('registers a purchase using the evaluated decision from the engine', async () => {
    const purchasesRepository = {
      findByPatientId: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'purchase-1' }),
    } as unknown as jest.Mocked<PurchasesRepository>;
    const patientsService = {
      getPatientById: jest.fn().mockResolvedValue({ id: 'patient-1' }),
    } as unknown as jest.Mocked<PatientsService>;
    const programStateService = {
      getStoredState: jest.fn().mockResolvedValue(null),
      storeCalculatedState: jest.fn().mockResolvedValue({
        patientId: 'patient-1',
        validPurchaseCount: 1,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-03-31T10:00:00.000Z'),
        currentLevel: '1',
        state: 'ACTIVE',
        updatedAt: new Date('2026-03-31T10:00:00.000Z'),
      }),
    } as unknown as jest.Mocked<ProgramStateService>;
    const discountEngineService = new DiscountEngineService();

    const service = new PurchasesService(
      purchasesRepository,
      patientsService,
      programStateService,
      discountEngineService,
    );

    const result = await service.registerPurchase({
      patientId: 'patient-1',
      purchaseDate: '2026-03-31T10:00:00.000Z',
      dose: '5 mg',
      listPrice: 3500,
      quantity: 1,
      isFree: false,
      isValid: true,
    });

    expect(purchasesRepository.create).toHaveBeenCalled();
    expect(programStateService.storeCalculatedState).toHaveBeenCalled();
    expect(result.discount.percentage).toBe(25);
    expect(result.reasons).toEqual([
      'Primera compra valida: el paciente entra al programa.',
    ]);
  });

  it('simulates a purchase without persisting it', async () => {
    const purchasesRepository = {
      findByPatientId: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    } as unknown as jest.Mocked<PurchasesRepository>;
    const patientsService = {
      getPatientById: jest.fn().mockResolvedValue({ id: 'patient-1' }),
    } as unknown as jest.Mocked<PatientsService>;
    const programStateService = {
      getStoredState: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<ProgramStateService>;

    const service = new PurchasesService(
      purchasesRepository,
      patientsService,
      programStateService,
      new DiscountEngineService(),
    );

    const result = await service.simulatePurchase({
      patientId: 'patient-1',
      purchaseDate: '2026-03-31T10:00:00.000Z',
      dose: '5 mg',
      listPrice: 3500,
      isFree: true,
      isValid: true,
    });

    expect(purchasesRepository.create).not.toHaveBeenCalled();
    expect(result.isValidPurchase).toBe(false);
    expect(result.programTypeApplied).toBe('FULL_PRICE');
  });
});
