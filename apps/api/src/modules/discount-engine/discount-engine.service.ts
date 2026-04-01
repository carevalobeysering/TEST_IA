import { Injectable } from '@nestjs/common';
import { ProgramStatus, Purchase } from '@prisma/client';

const STANDARD_WINDOW_DAYS = 35;
const RESET_WINDOW_START_DAY = 36;
const RESET_WINDOW_END_DAY = 44;
const RESCUE_TRIGGER_DAY = 45;
const RESCUE_WINDOW_DAYS = 7;
const MAX_DISCOUNTED_PURCHASES_PER_30_DAYS = 2;
const DEFAULT_LEVEL_DISCOUNT_PERCENTAGES = {
  '1': 25,
  '2': 30,
  '3': 35,
  '4': 40,
  '4+': 40,
} as const;
const RESCUE_DISCOUNT_PERCENTAGE = 40;

type ProgramLevel = '1' | '2' | '3' | '4' | '4+';

export type PurchaseEvaluationInput = {
  purchaseDate: Date;
  dose: string;
  quantity: number;
  listPrice: number;
  isFree: boolean;
  externallyInvalid: boolean;
};

export type DiscountDecision = {
  isValidPurchase: boolean;
  countedForProgress: boolean;
  programTypeApplied: 'STANDARD' | 'RESET' | 'RESCUE' | 'FULL_PRICE';
  discountPercentage: number;
  discountApplied: number;
  finalPrice: number;
  validPurchaseCount: number;
  rescueActive: boolean;
  rescueActivatedAt: Date | null;
  rescueStage: number | null;
  lastValidPurchaseDate: Date | null;
  currentLevel: ProgramLevel;
  state: 'ACTIVE' | 'RESCUE' | 'RESTARTED';
  reasons: string[];
};

export type ProgramStateView = {
  patientId: string;
  validPurchaseCount: number;
  rescueActive: boolean;
  rescueActivatedAt: string | null;
  rescueWindowEndsAt: string | null;
  rescueStage: number | null;
  lastValidPurchaseDate: string | null;
  currentLevel: ProgramLevel;
  state: 'active' | 'rescue' | 'restarted';
  statusMessage: string;
  nextBenefit: string | null;
};

type InternalState = {
  patientId: string;
  validPurchaseCount: number;
  rescueActive: boolean;
  rescueActivatedAt: Date | null;
  rescueStage: number | null;
  lastValidPurchaseDate: Date | null;
  currentLevel: ProgramLevel;
  state: 'ACTIVE' | 'RESCUE' | 'RESTARTED';
};

@Injectable()
export class DiscountEngineService {
  evaluatePurchase(
    currentState: ProgramStatus | null,
    purchaseHistory: Purchase[],
    input: PurchaseEvaluationInput,
  ): DiscountDecision {
    const normalizedState = this.normalizeState(currentState);
    const projectedState = this.projectStateInternal(
      normalizedState,
      input.purchaseDate,
    );

    if (input.externallyInvalid) {
      return this.buildFullPriceDecision(projectedState, input, [
        'La compra fue marcada como invalida por el origen.',
      ]);
    }

    if (input.isFree || input.listPrice <= 0) {
      return this.buildFullPriceDecision(projectedState, input, [
        'La compra gratuita no cuenta para el programa.',
      ]);
    }

    const rollingDiscountedUnits = this.getRollingDiscountedUnits(
      purchaseHistory,
      input.purchaseDate,
    );

    if (
      rollingDiscountedUnits + input.quantity >
      MAX_DISCOUNTED_PURCHASES_PER_30_DAYS
    ) {
      return this.buildFullPriceDecision(projectedState, input, [
        'Se excede el limite de 2 plumas con descuento en 30 dias moviles.',
      ]);
    }

    if (!normalizedState.lastValidPurchaseDate) {
      return this.buildStandardDecision({
        input,
        level: '1',
        validPurchaseCount: 1,
        state: 'ACTIVE',
        reasons: ['Primera compra valida: el paciente entra al programa.'],
      });
    }

    if (projectedState.rescueActive && projectedState.rescueStage === 1) {
      return this.buildRescueDecision({
        input,
        validPurchaseCount: 2,
        rescueActivatedAt: projectedState.rescueActivatedAt,
        rescueStage: 2,
        currentLevel: '2',
        completeRescueCycle: false,
        reasons: [
          'Compra realizada dentro de la ventana de rescate para la compra #2.',
        ],
      });
    }

    if (
      normalizedState.rescueActive &&
      (normalizedState.rescueStage ?? 0) >= 2
    ) {
      return this.evaluateRescueContinuation(normalizedState, input);
    }

    return this.evaluateStandardFlow(normalizedState, input);
  }

  projectCurrentState(
    patientId: string,
    currentState: ProgramStatus | null,
    referenceDate: Date,
  ): ProgramStateView {
    const projectedState = this.projectStateInternal(
      this.normalizeState(currentState, patientId),
      referenceDate,
    );

    return {
      patientId: projectedState.patientId,
      validPurchaseCount: projectedState.validPurchaseCount,
      rescueActive: projectedState.rescueActive,
      rescueActivatedAt:
        projectedState.rescueActivatedAt?.toISOString() ?? null,
      rescueWindowEndsAt: projectedState.rescueActivatedAt
        ? this.addDays(
            projectedState.rescueActivatedAt,
            RESCUE_WINDOW_DAYS - 1,
          ).toISOString()
        : null,
      rescueStage: projectedState.rescueStage,
      lastValidPurchaseDate:
        projectedState.lastValidPurchaseDate?.toISOString() ?? null,
      currentLevel: projectedState.currentLevel,
      state: this.mapExternalState(projectedState.state),
      statusMessage: this.buildStatusMessage(projectedState, referenceDate),
      nextBenefit: this.buildNextBenefit(projectedState),
    };
  }

  private evaluateStandardFlow(
    currentState: InternalState,
    input: PurchaseEvaluationInput,
  ): DiscountDecision {
    const lastValidPurchaseDate = currentState.lastValidPurchaseDate;

    if (!lastValidPurchaseDate) {
      return this.buildStandardDecision({
        input,
        level: '1',
        validPurchaseCount: 1,
        state: 'ACTIVE',
        reasons: ['Primera compra valida: el paciente entra al programa.'],
      });
    }

    const daysSinceLastValidPurchase = this.diffInDays(
      lastValidPurchaseDate,
      input.purchaseDate,
    );

    if (daysSinceLastValidPurchase <= STANDARD_WINDOW_DAYS) {
      const nextCount = currentState.validPurchaseCount + 1;
      const nextLevel = this.resolveLevel(nextCount);

      return this.buildStandardDecision({
        input,
        level: nextLevel,
        validPurchaseCount: nextCount,
        state: 'ACTIVE',
        reasons: [
          'La recompra se realizo dentro de los 35 dias y avanza en el programa.',
        ],
      });
    }

    if (
      daysSinceLastValidPurchase >= RESET_WINDOW_START_DAY &&
      daysSinceLastValidPurchase <= RESET_WINDOW_END_DAY
    ) {
      return this.buildResetDecision(input, [
        'La recompra ocurrio entre los dias 36 y 44; aplica descuento base y reinicio.',
      ]);
    }

    if (
      currentState.validPurchaseCount === 1 &&
      daysSinceLastValidPurchase >= RESCUE_TRIGGER_DAY &&
      daysSinceLastValidPurchase <= RESCUE_TRIGGER_DAY + RESCUE_WINDOW_DAYS - 1
    ) {
      return this.buildRescueDecision({
        input,
        validPurchaseCount: 2,
        rescueActivatedAt: this.addDays(
          lastValidPurchaseDate,
          RESCUE_TRIGGER_DAY,
        ),
        rescueStage: 2,
        currentLevel: '2',
        completeRescueCycle: false,
        reasons: [
          'El rescate se activo al dia 45 y la compra #2 entra en la ventana de 7 dias con 40%.',
        ],
      });
    }

    return this.buildResetDecision(input, [
      'La ventana valida expiro; la compra reinicia el programa como nueva compra #1.',
    ]);
  }

  private evaluateRescueContinuation(
    currentState: InternalState,
    input: PurchaseEvaluationInput,
  ): DiscountDecision {
    const lastValidPurchaseDate = currentState.lastValidPurchaseDate;

    if (!lastValidPurchaseDate) {
      return this.buildResetDecision(input, [
        'No existe una compra valida previa para continuar el rescate; se reinicia el programa.',
      ]);
    }

    const daysSinceLastValidPurchase = this.diffInDays(
      lastValidPurchaseDate,
      input.purchaseDate,
    );

    if (daysSinceLastValidPurchase <= STANDARD_WINDOW_DAYS) {
      const nextCount = currentState.validPurchaseCount + 1;
      const nextStage = (currentState.rescueStage ?? 1) + 1;
      const completeRescueCycle = nextStage >= 4;

      return this.buildRescueDecision({
        input,
        validPurchaseCount: nextCount,
        rescueActivatedAt: currentState.rescueActivatedAt,
        rescueStage: completeRescueCycle ? null : nextStage,
        currentLevel: this.resolveLevel(nextCount),
        completeRescueCycle,
        reasons: [
          completeRescueCycle
            ? 'La compra #4 completa el tramo de rescate; la siguiente vuelve al esquema normal.'
            : 'La compra de rescate mantiene 40% dentro de la ventana de 35 dias.',
        ],
      });
    }

    return this.buildResetDecision(input, [
      'Se perdio la continuidad del rescate; la compra reinicia el programa.',
    ]);
  }

  private buildStandardDecision({
    input,
    level,
    validPurchaseCount,
    state,
    reasons,
  }: {
    input: PurchaseEvaluationInput;
    level: ProgramLevel;
    validPurchaseCount: number;
    state: 'ACTIVE' | 'RESTARTED';
    reasons: string[];
  }): DiscountDecision {
    const discountPercentage = DEFAULT_LEVEL_DISCOUNT_PERCENTAGES[level];
    const discountApplied = this.calculateDiscount(
      input.listPrice,
      discountPercentage,
    );

    return {
      isValidPurchase: true,
      countedForProgress: true,
      programTypeApplied: state === 'RESTARTED' ? 'RESET' : 'STANDARD',
      discountPercentage,
      discountApplied,
      finalPrice: this.calculateFinalPrice(input.listPrice, discountApplied),
      validPurchaseCount,
      rescueActive: false,
      rescueActivatedAt: null,
      rescueStage: null,
      lastValidPurchaseDate: input.purchaseDate,
      currentLevel: level,
      state,
      reasons,
    };
  }

  private buildResetDecision(
    input: PurchaseEvaluationInput,
    reasons: string[],
  ): DiscountDecision {
    return this.buildStandardDecision({
      input,
      level: '1',
      validPurchaseCount: 1,
      state: 'RESTARTED',
      reasons,
    });
  }

  private buildRescueDecision({
    input,
    validPurchaseCount,
    rescueActivatedAt,
    rescueStage,
    currentLevel,
    completeRescueCycle,
    reasons,
  }: {
    input: PurchaseEvaluationInput;
    validPurchaseCount: number;
    rescueActivatedAt: Date | null;
    rescueStage: number | null;
    currentLevel: ProgramLevel;
    completeRescueCycle: boolean;
    reasons: string[];
  }): DiscountDecision {
    const discountApplied = this.calculateDiscount(
      input.listPrice,
      RESCUE_DISCOUNT_PERCENTAGE,
    );

    return {
      isValidPurchase: true,
      countedForProgress: true,
      programTypeApplied: 'RESCUE',
      discountPercentage: RESCUE_DISCOUNT_PERCENTAGE,
      discountApplied,
      finalPrice: this.calculateFinalPrice(input.listPrice, discountApplied),
      validPurchaseCount,
      rescueActive: !completeRescueCycle,
      rescueActivatedAt: completeRescueCycle ? null : rescueActivatedAt,
      rescueStage,
      lastValidPurchaseDate: input.purchaseDate,
      currentLevel,
      state: completeRescueCycle ? 'ACTIVE' : 'RESCUE',
      reasons,
    };
  }

  private buildFullPriceDecision(
    currentState: InternalState,
    input: PurchaseEvaluationInput,
    reasons: string[],
  ): DiscountDecision {
    return {
      isValidPurchase: false,
      countedForProgress: false,
      programTypeApplied: 'FULL_PRICE',
      discountPercentage: 0,
      discountApplied: 0,
      finalPrice: input.listPrice,
      validPurchaseCount: currentState.validPurchaseCount,
      rescueActive: currentState.rescueActive,
      rescueActivatedAt: currentState.rescueActivatedAt,
      rescueStage: currentState.rescueStage,
      lastValidPurchaseDate: currentState.lastValidPurchaseDate,
      currentLevel: currentState.currentLevel,
      state: currentState.state,
      reasons,
    };
  }

  private projectStateInternal(
    currentState: InternalState,
    referenceDate: Date,
  ): InternalState {
    const lastValidPurchaseDate = currentState.lastValidPurchaseDate;

    if (!lastValidPurchaseDate || currentState.rescueActive) {
      return currentState;
    }

    const daysSinceLastValidPurchase = this.diffInDays(
      lastValidPurchaseDate,
      referenceDate,
    );

    if (
      currentState.validPurchaseCount === 1 &&
      daysSinceLastValidPurchase >= RESCUE_TRIGGER_DAY &&
      daysSinceLastValidPurchase <= RESCUE_TRIGGER_DAY + RESCUE_WINDOW_DAYS - 1
    ) {
      return {
        ...currentState,
        rescueActive: true,
        rescueActivatedAt: this.addDays(
          lastValidPurchaseDate,
          RESCUE_TRIGGER_DAY,
        ),
        rescueStage: 1,
        state: 'RESCUE',
      };
    }

    return currentState;
  }

  private normalizeState(
    currentState: ProgramStatus | null,
    patientId = 'unknown-patient',
  ): InternalState {
    return {
      patientId: currentState?.patientId ?? patientId,
      validPurchaseCount: currentState?.validPurchaseCount ?? 0,
      rescueActive: currentState?.rescueActive ?? false,
      rescueActivatedAt: currentState?.rescueActivatedAt ?? null,
      rescueStage: currentState?.rescueStage ?? null,
      lastValidPurchaseDate: currentState?.lastValidPurchaseDate ?? null,
      currentLevel: (currentState?.currentLevel as ProgramLevel | null) ?? '1',
      state:
        (currentState?.state as 'ACTIVE' | 'RESCUE' | 'RESTARTED' | null) ??
        'ACTIVE',
    };
  }

  private buildStatusMessage(state: InternalState, referenceDate: Date) {
    const lastValidPurchaseDate = state.lastValidPurchaseDate;

    if (!lastValidPurchaseDate) {
      return 'El paciente aun no ha realizado una compra valida.';
    }

    if (
      state.rescueActive &&
      state.rescueStage === 1 &&
      state.rescueActivatedAt
    ) {
      return `Rescate activo hasta ${this.addDays(
        state.rescueActivatedAt,
        RESCUE_WINDOW_DAYS - 1,
      ).toISOString()}.`;
    }

    if (state.state === 'RESTARTED') {
      return 'El programa se reinicio y la ultima compra cuenta como nueva compra #1.';
    }

    if (state.rescueActive) {
      return 'El paciente esta en continuidad de rescate con 40%.';
    }

    const daysSinceLastValidPurchase = this.diffInDays(
      lastValidPurchaseDate,
      referenceDate,
    );

    if (daysSinceLastValidPurchase >= RESET_WINDOW_START_DAY) {
      return 'La proxima compra fuera de ventana puede reiniciar o entrar a rescate segun la etapa.';
    }

    return 'El paciente mantiene continuidad dentro de la ventana vigente.';
  }

  private buildNextBenefit(state: InternalState) {
    if (state.rescueActive) {
      return '40% en la siguiente compra de rescate dentro de la ventana vigente.';
    }

    const nextLevel = this.resolveLevel(state.validPurchaseCount + 1);
    const nextPercentage = DEFAULT_LEVEL_DISCOUNT_PERCENTAGES[nextLevel];

    return `${nextPercentage}% esperado en la siguiente compra valida.`;
  }

  private mapExternalState(state: InternalState['state']) {
    switch (state) {
      case 'RESCUE':
        return 'rescue' as const;
      case 'RESTARTED':
        return 'restarted' as const;
      case 'ACTIVE':
      default:
        return 'active' as const;
    }
  }

  private getRollingDiscountedUnits(
    purchaseHistory: Purchase[],
    referenceDate: Date,
  ) {
    return purchaseHistory.reduce((accumulator, purchase) => {
      const days = this.diffInDays(purchase.purchaseDate, referenceDate);
      const discounted = Number(purchase.discountApplied) > 0;

      if (
        days >= 0 &&
        days < 30 &&
        discounted &&
        purchase.isValid &&
        !purchase.isFree
      ) {
        return accumulator + purchase.quantity;
      }

      return accumulator;
    }, 0);
  }

  private resolveLevel(validPurchaseCount: number): ProgramLevel {
    if (validPurchaseCount <= 1) {
      return '1';
    }

    if (validPurchaseCount === 2) {
      return '2';
    }

    if (validPurchaseCount === 3) {
      return '3';
    }

    if (validPurchaseCount === 4) {
      return '4';
    }

    return '4+';
  }

  private calculateDiscount(listPrice: number, percentage: number) {
    return Number(((listPrice * percentage) / 100).toFixed(2));
  }

  private calculateFinalPrice(listPrice: number, discountApplied: number) {
    return Number((listPrice - discountApplied).toFixed(2));
  }

  private diffInDays(startDate: Date, endDate: Date) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return Math.floor(
      (endDate.getTime() - startDate.getTime()) / millisecondsPerDay,
    );
  }

  private addDays(referenceDate: Date, days: number) {
    return new Date(referenceDate.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
