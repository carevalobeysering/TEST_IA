import { Module } from '@nestjs/common';

import { DiscountEngineModule } from '../discount-engine/discount-engine.module';
import { ProgramStateController } from './program-state.controller';
import { ProgramStateRepository } from './program-state.repository';
import { ProgramStateService } from './program-state.service';

@Module({
  imports: [DiscountEngineModule],
  controllers: [ProgramStateController],
  providers: [ProgramStateRepository, ProgramStateService],
  exports: [ProgramStateRepository, ProgramStateService],
})
export class ProgramStateModule {}
