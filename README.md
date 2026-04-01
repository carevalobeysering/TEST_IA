# Mounjaro Discount System

Monorepo base para un sistema web de descuentos escalonados para pacientes.

## Stack

- Frontend: React + TypeScript + Vite + Material UI + Zustand
- Backend: NestJS + TypeScript + REST API
- Shared: tipos y constantes de dominio compartidos
- Orquestacion: npm workspaces + Turborepo

## Conexion local SQL Server

El runtime del backend puede trabajar en Windows con autenticacion integrada local mediante `DATABASE_CONNECTION_STRING` usando `mssql` + `msnodesqlv8`, mientras Prisma se conserva para schema, tipos y migraciones.

## Estructura

- `apps/web`: aplicacion web para pacientes
- `apps/api`: API REST y motor de reglas
- `packages/shared`: contratos de dominio compartidos
- `packages/config`: configuracion reutilizable de TypeScript, ESLint y Prettier
- `planes/avance.md`: bitacora de avance por fases

## Scripts

- `npm install`: instala dependencias del monorepo
- `npm run dev`: inicia frontend y backend en paralelo
- `npm run build`: compila todos los paquetes
- `npm run lint`: ejecuta lint en todo el monorepo
- `npm run test`: ejecuta pruebas automatizadas
- `npm run test:e2e`: ejecuta la prueba e2e del backend para salud

### API / Prisma

- `npm --workspace api run prisma:generate`: genera el cliente Prisma
- `npm --workspace api run prisma:migrate:dev`: ejecuta migraciones de desarrollo
- `npm --workspace api run prisma:migrate:dev -- --name init`: aplica la migracion inicial en desarrollo
- `npm --workspace api run prisma:studio`: abre Prisma Studio

Migracion inicial incluida en [apps/api/prisma/migrations/20260401090000_init/migration.sql](apps/api/prisma/migrations/20260401090000_init/migration.sql).

Si ya ejecutaste una version anterior de esa migracion con claves `NVARCHAR(1000)`, aplica la correccion manual en [apps/api/prisma/manual-sql/20260401091500_fix_sqlserver_key_lengths.sql](apps/api/prisma/manual-sql/20260401091500_fix_sqlserver_key_lengths.sql).

Para ejecucion local del backend en Windows, la API ahora puede usar una conexion integrada de SQL Server mediante `DATABASE_CONNECTION_STRING`, por ejemplo:

`Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-K27PT1K;Database=Farmacia;Trusted_Connection=Yes;Encrypt=Yes;TrustServerCertificate=Yes;`

## Backend base disponible

- `POST /api/patients`
- `GET /api/patients`
- `GET /api/patients/:id`
- `POST /api/purchases`
- `POST /api/purchases/simulate`
- `GET /api/purchases/patient/:patientId`
- `GET /api/program/patient/:patientId`
- `GET /api/health`

## Motor de reglas disponible

- Avance dentro de 35 dias
- Reinicio con descuento base entre dias 36 y 44
- Rescate desde dia 45 con ventana de 7 dias para compra #2
- Continuidad de rescate para compras #3 y #4 con 40%
- Vuelta al esquema normal despues de compra #4
- Limite movil de 2 plumas con descuento en 30 dias
- Cambio de dosis sin reinicio del contador
- Simulacion sin persistencia para evaluar descuento y estado resultante

## Estado actual

Fase 1, Fase 2, Fase 3 y Fase 4 completadas. Fase 5 en progreso con frontend ya conectado al backend para:

- acceso de paciente por identificador con alta inicial
- consulta de estado actual del programa
- consulta de historial de compras
- simulacion de compra sin persistencia
- registro de compra con refresco de estado e historial

La API acepta llamadas cross-origin y el frontend de Vite usa proxy a `/api` en desarrollo para simplificar el flujo local.

La validacion automatica actual en CI ejecuta `lint`, `build`, `test` y `test:e2e`.