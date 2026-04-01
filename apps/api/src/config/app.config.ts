export const appConfig = () => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
    environment: process.env.NODE_ENV ?? 'development',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
    connectionString: process.env.DATABASE_CONNECTION_STRING ?? '',
  },
});
