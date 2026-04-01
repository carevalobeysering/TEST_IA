import { Injectable } from '@nestjs/common';
import { Patient } from '@prisma/client';

import { PrismaService } from '../../persistence/prisma/prisma.service';

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Pick<Patient, 'name' | 'uniqueIdentifier'>) {
    return this.prisma.patient.create({ data });
  }

  findAll() {
    return this.prisma.patient.findMany({
      orderBy: { registeredAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
    });
  }

  findByUniqueIdentifier(uniqueIdentifier: string) {
    return this.prisma.patient.findUnique({
      where: { uniqueIdentifier },
    });
  }
}
