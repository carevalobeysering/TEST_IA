import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RegisterPurchaseDto } from './dto/register-purchase.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Purchase persisted and program state synchronized.',
  })
  register(@Body() registerPurchaseDto: RegisterPurchaseDto) {
    return this.purchasesService.registerPurchase(registerPurchaseDto);
  }

  @Post('simulate')
  @ApiOkResponse({ description: 'Evaluates a purchase without persisting it.' })
  simulate(@Body() registerPurchaseDto: RegisterPurchaseDto) {
    return this.purchasesService.simulatePurchase(registerPurchaseDto);
  }

  @Get('patient/:patientId')
  @ApiOkResponse({ description: 'Purchase history for a patient.' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.purchasesService.getPurchaseHistory(patientId);
  }
}
