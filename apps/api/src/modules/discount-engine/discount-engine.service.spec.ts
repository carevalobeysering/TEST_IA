import { DiscountEngineService } from './discount-engine.service';

describe('DiscountEngineService', () => {
  const service = new DiscountEngineService();

  it('advances when the repurchase happens within 35 days', () => {
    const decision = service.evaluatePurchase(
      {
        patientId: 'patient-1',
        validPurchaseCount: 1,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-01-01T00:00:00.000Z'),
        currentLevel: '1',
        state: 'ACTIVE',
        updatedAt: new Date(),
      },
      [],
      {
        purchaseDate: new Date('2026-01-30T00:00:00.000Z'),
        dose: '5 mg',
        quantity: 1,
        listPrice: 1000,
        isFree: false,
        externallyInvalid: false,
      },
    );

    expect(decision.isValidPurchase).toBe(true);
    expect(decision.validPurchaseCount).toBe(2);
    expect(decision.currentLevel).toBe('2');
    expect(decision.programTypeApplied).toBe('STANDARD');
  });

  it('resets when the repurchase happens between day 36 and 44', () => {
    const decision = service.evaluatePurchase(
      {
        patientId: 'patient-1',
        validPurchaseCount: 2,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-01-01T00:00:00.000Z'),
        currentLevel: '2',
        state: 'ACTIVE',
        updatedAt: new Date(),
      },
      [],
      {
        purchaseDate: new Date('2026-02-08T00:00:00.000Z'),
        dose: '7.5 mg',
        quantity: 1,
        listPrice: 1000,
        isFree: false,
        externallyInvalid: false,
      },
    );

    expect(decision.programTypeApplied).toBe('RESET');
    expect(decision.validPurchaseCount).toBe(1);
    expect(decision.currentLevel).toBe('1');
    expect(decision.state).toBe('RESTARTED');
  });

  it('activates rescue at day 45 and grants 40% for purchase #2', () => {
    const decision = service.evaluatePurchase(
      {
        patientId: 'patient-1',
        validPurchaseCount: 1,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-01-01T00:00:00.000Z'),
        currentLevel: '1',
        state: 'ACTIVE',
        updatedAt: new Date(),
      },
      [],
      {
        purchaseDate: new Date('2026-02-15T00:00:00.000Z'),
        dose: '5 mg',
        quantity: 1,
        listPrice: 1000,
        isFree: false,
        externallyInvalid: false,
      },
    );

    expect(decision.programTypeApplied).toBe('RESCUE');
    expect(decision.discountPercentage).toBe(40);
    expect(decision.validPurchaseCount).toBe(2);
    expect(decision.rescueActive).toBe(true);
    expect(decision.rescueStage).toBe(2);
  });

  it('resets when purchase #2 happens after the rescue window', () => {
    const decision = service.evaluatePurchase(
      {
        patientId: 'patient-1',
        validPurchaseCount: 1,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-01-01T00:00:00.000Z'),
        currentLevel: '1',
        state: 'ACTIVE',
        updatedAt: new Date(),
      },
      [],
      {
        purchaseDate: new Date('2026-02-22T00:00:00.000Z'),
        dose: '5 mg',
        quantity: 1,
        listPrice: 1000,
        isFree: false,
        externallyInvalid: false,
      },
    );

    expect(decision.programTypeApplied).toBe('RESET');
    expect(decision.validPurchaseCount).toBe(1);
    expect(decision.discountPercentage).toBe(25);
  });

  it('keeps 40% for rescue purchases #3 and #4 within 35 days', () => {
    const thirdDecision = service.evaluatePurchase(
      {
        patientId: 'patient-1',
        validPurchaseCount: 2,
        rescueActive: true,
        rescueActivatedAt: new Date('2026-02-15T00:00:00.000Z'),
        rescueStage: 2,
        lastValidPurchaseDate: new Date('2026-02-15T00:00:00.000Z'),
        currentLevel: '2',
        state: 'RESCUE',
        updatedAt: new Date(),
      },
      [],
      {
        purchaseDate: new Date('2026-03-10T00:00:00.000Z'),
        dose: '7.5 mg',
        quantity: 1,
        listPrice: 1000,
        isFree: false,
        externallyInvalid: false,
      },
    );

    const fourthDecision = service.evaluatePurchase(
      {
        patientId: 'patient-1',
        validPurchaseCount: 3,
        rescueActive: true,
        rescueActivatedAt: new Date('2026-02-15T00:00:00.000Z'),
        rescueStage: 3,
        lastValidPurchaseDate: new Date('2026-03-10T00:00:00.000Z'),
        currentLevel: '3',
        state: 'RESCUE',
        updatedAt: new Date(),
      },
      [],
      {
        purchaseDate: new Date('2026-03-25T00:00:00.000Z'),
        dose: '10 mg',
        quantity: 1,
        listPrice: 1000,
        isFree: false,
        externallyInvalid: false,
      },
    );

    expect(thirdDecision.discountPercentage).toBe(40);
    expect(thirdDecision.rescueStage).toBe(3);
    expect(fourthDecision.discountPercentage).toBe(40);
    expect(fourthDecision.rescueActive).toBe(false);
    expect(fourthDecision.state).toBe('ACTIVE');
  });

  it('blocks a third discounted purchase within a rolling 30-day window', () => {
    const decision = service.evaluatePurchase(
      {
        patientId: 'patient-1',
        validPurchaseCount: 2,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-01-20T00:00:00.000Z'),
        currentLevel: '2',
        state: 'ACTIVE',
        updatedAt: new Date(),
      },
      [
        {
          id: 'purchase-1',
          patientId: 'patient-1',
          purchaseDate: new Date('2026-01-05T00:00:00.000Z'),
          dose: '5 mg',
          quantity: 1,
          discountApplied: 250,
          isValid: true,
          isFree: false,
          listPrice: 1000,
          finalPrice: 750,
          programTypeApplied: 'STANDARD',
          createdAt: new Date(),
        },
        {
          id: 'purchase-2',
          patientId: 'patient-1',
          purchaseDate: new Date('2026-01-20T00:00:00.000Z'),
          dose: '5 mg',
          quantity: 1,
          discountApplied: 300,
          isValid: true,
          isFree: false,
          listPrice: 1000,
          finalPrice: 700,
          programTypeApplied: 'STANDARD',
          createdAt: new Date(),
        },
      ],
      {
        purchaseDate: new Date('2026-01-25T00:00:00.000Z'),
        dose: '7.5 mg',
        quantity: 1,
        listPrice: 1000,
        isFree: false,
        externallyInvalid: false,
      },
    );

    expect(decision.isValidPurchase).toBe(false);
    expect(decision.programTypeApplied).toBe('FULL_PRICE');
    expect(decision.countedForProgress).toBe(false);
  });

  it('does not reset the counter when the dose changes inside the valid window', () => {
    const decision = service.evaluatePurchase(
      {
        patientId: 'patient-1',
        validPurchaseCount: 2,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-01-10T00:00:00.000Z'),
        currentLevel: '2',
        state: 'ACTIVE',
        updatedAt: new Date(),
      },
      [],
      {
        purchaseDate: new Date('2026-01-20T00:00:00.000Z'),
        dose: '10 mg',
        quantity: 1,
        listPrice: 1000,
        isFree: false,
        externallyInvalid: false,
      },
    );

    expect(decision.validPurchaseCount).toBe(3);
    expect(decision.currentLevel).toBe('3');
  });

  it('keeps invalid purchases from advancing the counter', () => {
    const decision = service.evaluatePurchase(
      {
        patientId: 'patient-1',
        validPurchaseCount: 2,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-01-10T00:00:00.000Z'),
        currentLevel: '2',
        state: 'ACTIVE',
        updatedAt: new Date(),
      },
      [],
      {
        purchaseDate: new Date('2026-01-20T00:00:00.000Z'),
        dose: '10 mg',
        quantity: 1,
        listPrice: 1000,
        isFree: true,
        externallyInvalid: false,
      },
    );

    expect(decision.isValidPurchase).toBe(false);
    expect(decision.validPurchaseCount).toBe(2);
    expect(decision.countedForProgress).toBe(false);
  });

  it('projects rescue state on day 45 for patient status queries', () => {
    const state = service.projectCurrentState(
      'patient-1',
      {
        patientId: 'patient-1',
        validPurchaseCount: 1,
        rescueActive: false,
        rescueActivatedAt: null,
        rescueStage: null,
        lastValidPurchaseDate: new Date('2026-01-01T00:00:00.000Z'),
        currentLevel: '1',
        state: 'ACTIVE',
        updatedAt: new Date(),
      },
      new Date('2026-02-15T00:00:00.000Z'),
    );

    expect(state.state).toBe('rescue');
    expect(state.rescueActive).toBe(true);
    expect(state.rescueStage).toBe(1);
  });
});
