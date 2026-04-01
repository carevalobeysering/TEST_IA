import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma/prisma.service';
import type { PatientRecord } from '../../persistence/prisma/prisma.types';

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Pick<PatientRecord, 'name' | 'uniqueIdentifier'>,
  ): Promise<PatientRecord> {
    return this.prisma.patient.create({ data });
  }

  findAll(): Promise<PatientRecord[]> {
    return this.prisma.patient.findMany({
      orderBy: { registeredAt: 'desc' },
    });
  }

  findById(id: string): Promise<PatientRecord | null> {
    return this.prisma.patient.findUnique({
      where: { id },
    });
  }

  findByUniqueIdentifier(
    uniqueIdentifier: string,
  ): Promise<PatientRecord | null> {
    return this.prisma.patient.findUnique({
      where: { uniqueIdentifier },
    });
  }
}
