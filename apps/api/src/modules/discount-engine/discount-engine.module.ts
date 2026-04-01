import { Module } from '@nestjs/common';

import { DiscountEngineService } from './discount-engine.service';

@Module({
  providers: [DiscountEngineService],
  exports: [DiscountEngineService],
})
export class DiscountEngineModule {}
