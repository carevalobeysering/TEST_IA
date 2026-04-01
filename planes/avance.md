# Avance del proyecto

## Fases

### Fase 1: estructura y arquitectura
- Estado: Completada
- Completado:
  - Monorepo con npm workspaces y Turborepo
  - Base de apps `web` y `api`
  - Paquetes `shared` y `config`
  - Pipeline CI para Pull Requests
  - Bitacora inicial y README
  - Validacion completa de `lint`, `build` y `test` desde la raiz
  - Tarea de VS Code `Validate monorepo`

### Fase 2: modelo de datos y backend base
- Estado: Completada
- Completado:
  - Prisma integrado en `apps/api` con version compatible con Node del entorno
  - Schema inicial SQL Server para `Patient`, `Purchase`, `ProgramStatus` y `DiscountConfiguration`
  - Variables de entorno base en `.env` y `.env.example`
  - Capa de persistencia con `PrismaModule` y `PrismaService`
  - Modulos backend de pacientes, compras y estado del programa
  - Endpoints REST base para crear pacientes, registrar compras y consultar estado e historial
  - Pruebas unitarias base para sincronizacion de estado y registro de compras
  - Migracion inicial de Prisma para SQL Server agregada al repositorio
  - Adaptacion del runtime backend para SQL Server local con autenticacion integrada en Windows
  - Validacion exitosa de `npm run lint`, `npm run build` y `npm run test`

### Fase 3: motor de reglas del programa
- Estado: Completada
- Completado:
  - Motor de reglas desacoplado en `DiscountEngineService`
  - Ventana de continuidad de 35 dias
  - Reinicio entre dias 36 y 44 con descuento base y nueva compra #1
  - Activacion de rescate en dia 45 con ventana de 7 dias para compra #2
  - Continuidad de rescate para compras #3 y #4 con 40%
  - Regreso al esquema normal despues de completar compra #4 en rescate
  - Limite movil de 2 plumas con descuento por 30 dias moviles
  - Cambio de dosis sin reinicio de contador
  - Endpoint de simulacion sin persistencia
  - Suite de pruebas unitarias para los escenarios criticos del programa

### Fase 4: frontend
- Estado: Completada
- Completado:
  - Login de paciente conectado al backend con busqueda por identificador y alta inicial
  - Dashboard conectado al estado real del programa
  - Historial conectado al backend
  - Simulador conectado al endpoint de simulacion
  - Registro de compra desde la UI con refresco de historial y estado
  - Proxy dev en Vite para `/api` y CORS habilitado en NestJS

### Fase 5: testing
- Estado: En progreso
- Completado:
  - Jest backend para controladores y servicios base
  - Cobertura unitaria del motor de reglas con escenarios criticos
  - Pruebas frontend para login, dashboard, historial y simulador con Testing Library
  - Cobertura de errores frontend para alta/login sin nombre y simulacion fallida
  - Suite frontend actualizada a 10 pruebas pasando en el paquete `web`
  - Prueba e2e backend para `GET /api/health` aislada de SQL Server
  - Validacion completa del monorepo con 25 pruebas pasando, `lint` y `build` en verde
- Pendiente:
  - Evaluar cobertura agregada y escenarios de regresion del programa
  - Considerar pruebas e2e del flujo completo paciente -> simulacion -> compra -> historial

### Fase 6: CI/CD
- Estado: En progreso
- Completado:
  - Workflow base de GitHub Actions para PR
  - Repositorio Git local inicializado con rama `main`
  - Rama `dev` creada a partir de `main`
  - Workflow ajustado para ejecutar validaciones solo en Pull Requests hacia `main`
  - Scripts validados para `lint`, `build` y `test`
  - Script raiz `test:e2e` para backend
  - Validacion CI extendida con prueba e2e de salud
- Pendiente:
  - Crear el repositorio remoto en GitHub o conectar `origin`
  - Ajustar protecciones de rama en GitHub para requerir el check `validate` antes de permitir merge a `main`

### Fase 7: documentacion y cierre
- Estado: Pendiente

## Decisiones tecnicas tomadas

- Se usa npm workspaces en lugar de pnpm por una restriccion local de permisos al activar Corepack sobre `C:\Program Files\nodejs`.
- Se mantiene Turborepo para orquestar build, lint y test a nivel monorepo.
- Se crea un paquete compartido para contratos del dominio antes de implementar la logica de negocio.
- Frontend modular por features con Zustand y Material UI para acelerar una base mantenible.
- Prisma se fija en `6.16.2` porque Prisma 7 requiere una version de Node superior a la disponible en este entorno.
- En SQL Server los estados y tipos de programa se persisten como strings controlados por la aplicacion, porque el conector Prisma usado aqui no acepta enums para este esquema.
- El motor de reglas se mantiene desacoplado de controladores y repositorios para poder probarlo como servicio puro de dominio.
- La API calcula el descuento al registrar o simular una compra; no depende del precio final enviado por el cliente para determinar la elegibilidad.

## Problemas encontrados

- `corepack enable` no pudo escribir binarios globales por `EPERM`.
- `create-vite` mas reciente fallo por compatibilidad con la version disponible de Node en el entorno.
- `npm install` reporta vulnerabilidades transitivas del ecosistema; no bloquean esta fase pero deben revisarse cuando se estabilice la seleccion final de dependencias.
- Prisma 7 no pudo instalarse por requerimientos de Node; se resolvio fijando Prisma 6.
- El conector SQL Server de Prisma rechazo enums en el schema; se resolvio modelando esos valores como strings controlados en la capa de aplicacion.
- El backend Nest con `moduleResolution` NodeNext no resolvio de forma fiable el paquete compartido para este motor; se desacoplaron las constantes de reglas dentro del backend sin afectar el paquete compartido usado por frontend.
- Para el entorno local del usuario, Prisma no resulto adecuado como cliente runtime por depender de una ruta TCP distinta a la conexion Windows actual; se mantuvo Prisma para schema y migraciones, y el acceso runtime se adapto con `mssql` + `msnodesqlv8`.

## Siguiente paso recomendado

1. Considerar pruebas e2e del flujo completo paciente -> simulacion -> compra -> historial.
2. Preparar migracion inicial y semilla de configuracion de descuentos para una base SQL Server real.
3. Ajustar protecciones de rama y despliegue segun el entorno objetivo.