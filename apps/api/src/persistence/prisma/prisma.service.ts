import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Patient, ProgramStatus, Purchase } from '@prisma/client';
import sql from 'mssql/msnodesqlv8';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pool: sql.ConnectionPool | null = null;

  async onModuleInit() {
    this.pool = await sql.connect({
      connectionString: this.getConnectionString(),
      options: {
        trustedConnection: true,
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    });
  }

  async onModuleDestroy() {
    await this.pool?.close();
    this.pool = null;
  }

  readonly patient = {
    create: async ({ data }: { data: Pick<Patient, 'name' | 'uniqueIdentifier'> }) => {
      const id = this.createId();
      const result = await this.request()
        .input('id', sql.NVarChar(30), id)
        .input('name', sql.NVarChar(120), data.name)
        .input('uniqueIdentifier', sql.NVarChar(80), data.uniqueIdentifier)
        .query(`
          INSERT INTO dbo.Patient (id, name, uniqueIdentifier, registeredAt)
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.uniqueIdentifier, INSERTED.registeredAt
          VALUES (@id, @name, @uniqueIdentifier, SYSUTCDATETIME())
        `);

      return this.mapPatient(result.recordset[0]);
    },
    findMany: async ({ orderBy }: { orderBy?: { registeredAt?: 'desc' | 'asc' } } = {}) => {
      const direction = orderBy?.registeredAt === 'asc' ? 'ASC' : 'DESC';
      const result = await this.request().query(`
        SELECT id, name, uniqueIdentifier, registeredAt
        FROM dbo.Patient
        ORDER BY registeredAt ${direction}
      `);

      return result.recordset.map((row) => this.mapPatient(row));
    },
    findUnique: async ({ where }: { where: { id?: string; uniqueIdentifier?: string } }) => {
      const request = this.request();

      if (where.id) {
        request.input('id', sql.NVarChar(30), where.id);
        const result = await request.query(`
          SELECT TOP 1 id, name, uniqueIdentifier, registeredAt
          FROM dbo.Patient
          WHERE id = @id
        `);

        return result.recordset[0] ? this.mapPatient(result.recordset[0]) : null;
      }

      if (where.uniqueIdentifier) {
        request.input('uniqueIdentifier', sql.NVarChar(80), where.uniqueIdentifier);
        const result = await request.query(`
          SELECT TOP 1 id, name, uniqueIdentifier, registeredAt
          FROM dbo.Patient
          WHERE uniqueIdentifier = @uniqueIdentifier
        `);

        return result.recordset[0] ? this.mapPatient(result.recordset[0]) : null;
      }

      return null;
    },
  };

  readonly purchase = {
    create: async ({
      data,
    }: {
      data: {
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
    }) => {
      const id = this.createId();
      const result = await this.request()
        .input('id', sql.NVarChar(30), id)
        .input('patientId', sql.NVarChar(30), data.patientId)
        .input('purchaseDate', sql.DateTime2, data.purchaseDate)
        .input('dose', sql.NVarChar(20), data.dose)
        .input('quantity', sql.Int, data.quantity)
        .input('discountApplied', sql.Decimal(10, 2), data.discountApplied)
        .input('isValid', sql.Bit, data.isValid)
        .input('isFree', sql.Bit, data.isFree)
        .input('listPrice', sql.Decimal(10, 2), data.listPrice)
        .input('finalPrice', sql.Decimal(10, 2), data.finalPrice)
        .input('programTypeApplied', sql.NVarChar(20), data.programTypeApplied)
        .query(`
          INSERT INTO dbo.Purchase (
            id,
            patientId,
            purchaseDate,
            dose,
            quantity,
            discountApplied,
            isValid,
            isFree,
            listPrice,
            finalPrice,
            programTypeApplied,
            createdAt
          )
          OUTPUT INSERTED.*
          VALUES (
            @id,
            @patientId,
            @purchaseDate,
            @dose,
            @quantity,
            @discountApplied,
            @isValid,
            @isFree,
            @listPrice,
            @finalPrice,
            @programTypeApplied,
            SYSUTCDATETIME()
          )
        `);

      return this.mapPurchase(result.recordset[0]);
    },
    findMany: async ({
      where,
      orderBy,
    }: {
      where?: { patientId?: string };
      orderBy?: { purchaseDate?: 'asc' | 'desc' };
    } = {}) => {
      const direction = orderBy?.purchaseDate === 'desc' ? 'DESC' : 'ASC';
      const request = this.request();
      let query = `
        SELECT *
        FROM dbo.Purchase
      `;

      if (where?.patientId) {
        request.input('patientId', sql.NVarChar(30), where.patientId);
        query += ' WHERE patientId = @patientId';
      }

      query += ` ORDER BY purchaseDate ${direction}`;

      const result = await request.query(query);

      return result.recordset.map((row) => this.mapPurchase(row));
    },
    findFirst: async ({
      where,
      orderBy,
    }: {
      where: { patientId: string; isValid?: boolean; isFree?: boolean };
      orderBy?: { purchaseDate?: 'asc' | 'desc' };
    }) => {
      const direction = orderBy?.purchaseDate === 'asc' ? 'ASC' : 'DESC';
      const request = this.request()
        .input('patientId', sql.NVarChar(30), where.patientId)
        .input('isValid', sql.Bit, where.isValid ?? true)
        .input('isFree', sql.Bit, where.isFree ?? false);

      const result = await request.query(`
        SELECT TOP 1 *
        FROM dbo.Purchase
        WHERE patientId = @patientId
          AND isValid = @isValid
          AND isFree = @isFree
        ORDER BY purchaseDate ${direction}
      `);

      return result.recordset[0] ? this.mapPurchase(result.recordset[0]) : null;
    },
  };

  readonly programStatus = {
    findUnique: async ({ where }: { where: { patientId: string } }) => {
      const result = await this.request()
        .input('patientId', sql.NVarChar(30), where.patientId)
        .query(`
          SELECT TOP 1 *
          FROM dbo.ProgramStatus
          WHERE patientId = @patientId
        `);

      return result.recordset[0] ? this.mapProgramStatus(result.recordset[0]) : null;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { patientId: string };
      create: {
        patientId: string;
        validPurchaseCount: number;
        rescueActive: boolean;
        rescueActivatedAt: Date | null;
        rescueStage: number | null;
        lastValidPurchaseDate: Date | null;
        currentLevel: string;
        state: string;
      };
      update: {
        validPurchaseCount: number;
        rescueActive: boolean;
        rescueActivatedAt: Date | null;
        rescueStage: number | null;
        lastValidPurchaseDate: Date | null;
        currentLevel: string;
        state: string;
      };
    }) => {
      const source = create ?? { patientId: where.patientId, ...update };
      const request = this.request()
        .input('patientId', sql.NVarChar(30), where.patientId)
        .input('validPurchaseCount', sql.Int, update.validPurchaseCount)
        .input('rescueActive', sql.Bit, update.rescueActive)
        .input('rescueActivatedAt', sql.DateTime2, update.rescueActivatedAt)
        .input('rescueStage', sql.Int, update.rescueStage)
        .input('lastValidPurchaseDate', sql.DateTime2, update.lastValidPurchaseDate)
        .input('currentLevel', sql.NVarChar(10), update.currentLevel)
        .input('state', sql.NVarChar(20), update.state);

      const result = await request.query(`
        IF EXISTS (SELECT 1 FROM dbo.ProgramStatus WHERE patientId = @patientId)
        BEGIN
          UPDATE dbo.ProgramStatus
          SET
            validPurchaseCount = @validPurchaseCount,
            rescueActive = @rescueActive,
            rescueActivatedAt = @rescueActivatedAt,
            rescueStage = @rescueStage,
            lastValidPurchaseDate = @lastValidPurchaseDate,
            currentLevel = @currentLevel,
            state = @state,
            updatedAt = SYSUTCDATETIME()
          OUTPUT INSERTED.*
          WHERE patientId = @patientId;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.ProgramStatus (
            patientId,
            validPurchaseCount,
            rescueActive,
            rescueActivatedAt,
            rescueStage,
            lastValidPurchaseDate,
            currentLevel,
            state,
            updatedAt
          )
          OUTPUT INSERTED.*
          VALUES (
            @patientId,
            @validPurchaseCount,
            @rescueActive,
            @rescueActivatedAt,
            @rescueStage,
            @lastValidPurchaseDate,
            @currentLevel,
            @state,
            SYSUTCDATETIME()
          );
        END
      `);

      return this.mapProgramStatus(result.recordset[0] ?? source);
    },
  };

  private getConnectionString() {
    const connectionString = process.env.DATABASE_CONNECTION_STRING?.trim();

    if (!connectionString) {
      throw new Error(
        'DATABASE_CONNECTION_STRING is required for the local SQL Server runtime connection.',
      );
    }

    return connectionString;
  }

  private request() {
    if (!this.pool) {
      throw new Error('Database connection pool has not been initialized.');
    }

    return this.pool.request();
  }

  private createId() {
    return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 30);
  }

  private mapPatient(row: Record<string, unknown>): Patient {
    return {
      id: String(row.id),
      name: String(row.name),
      uniqueIdentifier: String(row.uniqueIdentifier),
      registeredAt: new Date(String(row.registeredAt)),
    };
  }

  private mapPurchase(row: Record<string, unknown>): Purchase {
    return {
      id: String(row.id),
      patientId: String(row.patientId),
      purchaseDate: new Date(String(row.purchaseDate)),
      dose: String(row.dose),
      quantity: Number(row.quantity),
      discountApplied: Number(row.discountApplied),
      isValid: Boolean(row.isValid),
      isFree: Boolean(row.isFree),
      listPrice: Number(row.listPrice),
      finalPrice: Number(row.finalPrice),
      programTypeApplied: String(row.programTypeApplied),
      createdAt: new Date(String(row.createdAt)),
    } as unknown as Purchase;
  }

  private mapProgramStatus(row: Record<string, unknown>): ProgramStatus {
    return {
      patientId: String(row.patientId),
      validPurchaseCount: Number(row.validPurchaseCount),
      rescueActive: Boolean(row.rescueActive),
      rescueActivatedAt: row.rescueActivatedAt ? new Date(String(row.rescueActivatedAt)) : null,
      rescueStage: row.rescueStage === null || row.rescueStage === undefined ? null : Number(row.rescueStage),
      lastValidPurchaseDate: row.lastValidPurchaseDate ? new Date(String(row.lastValidPurchaseDate)) : null,
      currentLevel: String(row.currentLevel),
      state: String(row.state),
      updatedAt: row.updatedAt ? new Date(String(row.updatedAt)) : new Date(),
    } as ProgramStatus;
  }
}
