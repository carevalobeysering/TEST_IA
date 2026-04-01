import { Injectable } from '@nestjs/common';

import { DiscountEngineService } from '../discount-engine/discount-engine.service';
import { PatientsService } from '../patients/patients.service';
import { ProgramStateService } from '../program-state/program-state.service';
import { RegisterPurchaseDto } from './dto/register-purchase.dto';
import { PurchasesRepository } from './purchases.repository';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly purchasesRepository: PurchasesRepository,
    private readonly patientsService: PatientsService,
    private readonly programStateService: ProgramStateService,
    private readonly discountEngineService: DiscountEngineService,
  ) {}

  async registerPurchase(registerPurchaseDto: RegisterPurchaseDto) {
    await this.patientsService.getPatientById(registerPurchaseDto.patientId);

    const currentState = await this.programStateService.getStoredState(
      registerPurchaseDto.patientId,
    );
    const purchaseHistory = await this.purchasesRepository.findByPatientId(
      registerPurchaseDto.patientId,
    );
    const decision = this.discountEngineService.evaluatePurchase(
      currentState,
      purchaseHistory,
      {
        purchaseDate: new Date(registerPurchaseDto.purchaseDate),
        dose: registerPurchaseDto.dose,
        quantity: registerPurchaseDto.quantity ?? 1,
        listPrice: registerPurchaseDto.listPrice,
        isFree: registerPurchaseDto.isFree ?? false,
        externallyInvalid: registerPurchaseDto.isValid === false,
      },
    );

    const purchase = await this.purchasesRepository.create({
      patientId: registerPurchaseDto.patientId,
      purchaseDate: new Date(registerPurchaseDto.purchaseDate),
      dose: registerPurchaseDto.dose,
      quantity: registerPurchaseDto.quantity ?? 1,
      discountApplied: decision.discountApplied,
      isValid: decision.isValidPurchase,
      isFree: registerPurchaseDto.isFree ?? false,
      listPrice: registerPurchaseDto.listPrice,
      finalPrice: decision.finalPrice,
      programTypeApplied: decision.programTypeApplied,
    });

    const storedProgramState =
      decision.isValidPurchase || currentState
        ? await this.programStateService.storeCalculatedState(
            registerPurchaseDto.patientId,
            decision,
          )
        : null;
    const programState = this.discountEngineService.projectCurrentState(
      registerPurchaseDto.patientId,
      storedProgramState,
      new Date(registerPurchaseDto.purchaseDate),
    );

    return {
      purchase,
      programState,
      discount: {
        percentage: decision.discountPercentage,
        amount: decision.discountApplied,
        finalPrice: decision.finalPrice,
      },
      reasons: decision.reasons,
    };
  }

  async simulatePurchase(registerPurchaseDto: RegisterPurchaseDto) {
    await this.patientsService.getPatientById(registerPurchaseDto.patientId);

    const currentState = await this.programStateService.getStoredState(
      registerPurchaseDto.patientId,
    );
    const purchaseHistory = await this.purchasesRepository.findByPatientId(
      registerPurchaseDto.patientId,
    );
    const decision = this.discountEngineService.evaluatePurchase(
      currentState,
      purchaseHistory,
      {
        purchaseDate: new Date(registerPurchaseDto.purchaseDate),
        dose: registerPurchaseDto.dose,
        quantity: registerPurchaseDto.quantity ?? 1,
        listPrice: registerPurchaseDto.listPrice,
        isFree: registerPurchaseDto.isFree ?? false,
        externallyInvalid: registerPurchaseDto.isValid === false,
      },
    );

    return {
      patientId: registerPurchaseDto.patientId,
      purchaseDate: registerPurchaseDto.purchaseDate,
      quantity: registerPurchaseDto.quantity ?? 1,
      discount: {
        percentage: decision.discountPercentage,
        amount: decision.discountApplied,
        finalPrice: decision.finalPrice,
      },
      programState: {
        validPurchaseCount: decision.validPurchaseCount,
        rescueActive: decision.rescueActive,
        rescueActivatedAt: decision.rescueActivatedAt?.toISOString() ?? null,
        rescueStage: decision.rescueStage,
        lastValidPurchaseDate:
          decision.lastValidPurchaseDate?.toISOString() ?? null,
        currentLevel: decision.currentLevel,
        state: decision.state.toLowerCase(),
      },
      programTypeApplied: decision.programTypeApplied,
      isValidPurchase: decision.isValidPurchase,
      countedForProgress: decision.countedForProgress,
      reasons: decision.reasons,
    };
  }

  getPurchaseHistory(patientId: string) {
    return this.purchasesRepository.findByPatientId(patientId);
  }
}
