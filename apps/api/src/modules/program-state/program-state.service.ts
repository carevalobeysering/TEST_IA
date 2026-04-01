import { Injectable } from '@nestjs/common';

import {
  DiscountDecision,
  DiscountEngineService,
} from '../discount-engine/discount-engine.service';
import { ProgramStateRepository } from './program-state.repository';

@Injectable()
export class ProgramStateService {
  constructor(
    private readonly programStateRepository: ProgramStateRepository,
    private readonly discountEngineService: DiscountEngineService,
  ) {}

  async getPatientState(patientId: string) {
    const currentState =
      await this.programStateRepository.findByPatientId(patientId);

    return this.discountEngineService.projectCurrentState(
      patientId,
      currentState,
      new Date(),
    );
  }

  getStoredState(patientId: string) {
    return this.programStateRepository.findByPatientId(patientId);
  }

  async storeCalculatedState(patientId: string, decision: DiscountDecision) {
    return this.programStateRepository.upsert({
      patientId,
      validPurchaseCount: decision.validPurchaseCount,
      rescueActive: decision.rescueActive,
      rescueActivatedAt: decision.rescueActivatedAt,
      rescueStage: decision.rescueStage,
      lastValidPurchaseDate: decision.lastValidPurchaseDate,
      currentLevel: decision.currentLevel,
      state: decision.state,
    });
  }
}
