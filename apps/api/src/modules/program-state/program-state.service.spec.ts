import { DiscountEngineService } from '../discount-engine/discount-engine.service';
import { ProgramStateRepository } from './program-state.repository';
import { ProgramStateService } from './program-state.service';

describe('ProgramStateService', () => {
  it('projects rescue dynamically on day 45 for state queries', async () => {
    const repository = {
      findByPatientId: jest.fn().mockResolvedValue({
        patientId: 'patient-1',
        validPurchaseCount: 1,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-01-01T00:00:00.000Z'),
        currentLevel: '1',
        state: 'ACTIVE',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    } as unknown as jest.Mocked<ProgramStateRepository>;

    const engine = new DiscountEngineService();
    jest.useFakeTimers().setSystemTime(new Date('2026-02-15T00:00:00.000Z'));

    const service = new ProgramStateService(repository, engine);
    const result = await service.getPatientState('patient-1');

    expect(result.validPurchaseCount).toBe(1);
    expect(result.currentLevel).toBe('1');
    expect(result.state).toBe('rescue');
    expect(result.rescueActive).toBe(true);

    jest.useRealTimers();
  });

  it('stores a calculated decision in program status', async () => {
    const repository = {
      findByPatientId: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ patientId: 'patient-2' }),
    } as unknown as jest.Mocked<ProgramStateRepository>;

    const service = new ProgramStateService(
      repository,
      new DiscountEngineService(),
    );

    await service.storeCalculatedState('patient-2', {
      isValidPurchase: true,
      countedForProgress: true,
      programTypeApplied: 'STANDARD',
      discountPercentage: 25,
      discountApplied: 250,
      finalPrice: 750,
      validPurchaseCount: 1,
      rescueActive: false,
      rescueActivatedAt: null,
      rescueStage: null,
      lastValidPurchaseDate: new Date('2026-03-31T10:00:00.000Z'),
      currentLevel: '1',
      state: 'ACTIVE',
      reasons: ['Primera compra valida.'],
    });

    expect(repository.upsert).toHaveBeenCalledWith({
      patientId: 'patient-2',
      validPurchaseCount: 1,
      rescueActive: false,
      rescueActivatedAt: null,
      rescueStage: null,
      lastValidPurchaseDate: new Date('2026-03-31T10:00:00.000Z'),
      currentLevel: '1',
      state: 'ACTIVE',
    });
  });
});
