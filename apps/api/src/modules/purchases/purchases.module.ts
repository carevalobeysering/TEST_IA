import { Module } from '@nestjs/common';

import { DiscountEngineModule } from '../discount-engine/discount-engine.module';
import { PatientsModule } from '../patients/patients.module';
import { ProgramStateModule } from '../program-state/program-state.module';
import { PurchasesController } from './purchases.controller';
import { PurchasesRepository } from './purchases.repository';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [DiscountEngineModule, PatientsModule, ProgramStateModule],
  controllers: [PurchasesController],
  providers: [PurchasesRepository, PurchasesService],
  exports: [PurchasesRepository, PurchasesService],
})
export class PurchasesModule {}
