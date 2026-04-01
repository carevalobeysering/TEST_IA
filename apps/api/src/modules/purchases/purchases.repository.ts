import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma/prisma.service';
import type { PurchaseRecord } from '../../persistence/prisma/prisma.types';

type CreatePurchaseInput = {
  patientId: string;
  purchaseDate: Date;
  dose: string;
  quantity: number;
  discountApplied: number;
  isValid: boolean;
  isFree: boolean;
  listPrice: number;
  finalPrice: number;
  programTypeApplied: string;
};

@Injectable()
export class PurchasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreatePurchaseInput): Promise<PurchaseRecord> {
    return this.prisma.purchase.create({ data });
  }

  findByPatientId(patientId: string): Promise<PurchaseRecord[]> {
    return this.prisma.purchase.findMany({
      where: { patientId },
      orderBy: { purchaseDate: 'asc' },
    });
  }

  findLatestValidPurchaseByPatientId(
    patientId: string,
  ): Promise<PurchaseRecord | null> {
    return this.prisma.purchase.findFirst({
      where: {
        patientId,
        isValid: true,
        isFree: false,
      },
      orderBy: { purchaseDate: 'desc' },
    });
  }
}
