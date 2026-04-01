import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig } from './config/app.config';
import { HealthModule } from './modules/health/health.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ProgramStateModule } from './modules/program-state/program-state.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { PrismaModule } from './persistence/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    HealthModule,
    PatientsModule,
    ProgramStateModule,
    PurchasesModule,
  ],
})
export class AppModule {}
