import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ProgramStateService } from './program-state.service';

@ApiTags('program-state')
@Controller('program')
export class ProgramStateController {
  constructor(private readonly programStateService: ProgramStateService) {}

  @Get('patient/:patientId')
  @ApiOkResponse({ description: 'Current program state for a patient.' })
  getPatientState(@Param('patientId') patientId: string) {
    return this.programStateService.getPatientState(patientId);
  }
}
