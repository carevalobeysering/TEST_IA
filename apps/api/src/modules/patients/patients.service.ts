import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async createPatient(createPatientDto: CreatePatientDto) {
    const existingPatient =
      await this.patientsRepository.findByUniqueIdentifier(
        createPatientDto.uniqueIdentifier,
      );

    if (existingPatient) {
      throw new ConflictException(
        'A patient with this unique identifier already exists.',
      );
    }

    return this.patientsRepository.create(createPatientDto);
  }

  findPatients(identifier?: string) {
    if (identifier) {
      return this.patientsRepository.findByUniqueIdentifier(identifier);
    }

    return this.patientsRepository.findAll();
  }

  async getPatientById(id: string) {
    const patient = await this.patientsRepository.findById(id);

    if (!patient) {
      throw new NotFoundException(`Patient ${id} was not found.`);
    }

    return patient;
  }
}
