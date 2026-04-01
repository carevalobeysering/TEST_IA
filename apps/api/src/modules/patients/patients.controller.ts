import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Patient created successfully.' })
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.createPatient(createPatientDto);
  }

  @Get()
  @ApiQuery({ name: 'identifier', required: false })
  @ApiOkResponse({
    description: 'Patient list or single patient by identifier.',
  })
  findAll(@Query('identifier') identifier?: string) {
    return this.patientsService.findPatients(identifier);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Patient detail.' })
  findOne(@Param('id') id: string) {
    return this.patientsService.getPatientById(id);
  }
}
