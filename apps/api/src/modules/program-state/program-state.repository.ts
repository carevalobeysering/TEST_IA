import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma/prisma.service';

type UpsertProgramStateInput = {
  patientId: string;
  validPurchaseCount: number;
  rescueActive: boolean;
  rescueActivatedAt: Date | null;
  rescueStage: number | null;
  lastValidPurchaseDate: Date | null;
  currentLevel: string;
  state: string;
};

@Injectable()
export class ProgramStateRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByPatientId(patientId: string) {
    return this.prisma.programStatus.findUnique({
      where: { patientId },
    });
  }

  upsert(input: UpsertProgramStateInput) {
    const { patientId, ...data } = input;

    return this.prisma.programStatus.upsert({
      where: { patientId },
      create: {
        patientId,
        ...data,
      },
      update: data,
    });
  }
}
