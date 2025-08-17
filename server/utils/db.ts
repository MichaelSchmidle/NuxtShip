import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = `postgresql://${process.env.APP_DB_USER}:${process.env.APP_DB_PASSWORD}@${process.env.APP_DB_HOST || 'localhost'}:${process.env.APP_DB_PORT || 5432}/${process.env.APP_DB_NAME}`

const sql = postgres(connectionString)
export const db = drizzle(sql)