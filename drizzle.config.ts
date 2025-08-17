import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema/*',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.APP_DB_HOST || 'localhost',
    port: Number(process.env.APP_DB_PORT) || 5432,
    user: process.env.APP_DB_USER || 'app',
    password: process.env.APP_DB_PASSWORD || '',
    database: process.env.APP_DB_NAME || 'app',
  },
  verbose: true,
  strict: true,
})