import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, type BunSQLQueryResultHKT } from "drizzle-orm/bun-sql";
import { customType, PgTransaction } from "drizzle-orm/pg-core";

const userdata = `${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}`;
const host = `${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`;
const URL = `postgres://${userdata}@${host}/${process.env.POSTGRES_DB}`;
console.log("Connecting to database with URL:", URL);
const db = drizzle(URL);
await db
    .execute(
        sql`SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public';`,
    )
    .then((res) => {
        console.log("Database connection successful", res);
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
        process.exit(1);
    });
export const bytea = customType<{
    data: Buffer;
    default: false;
}>({
    dataType() {
        return "bytea";
    },
});

export const citext = customType<{ data: string; default: false }>({
    dataType() {
        return "citext";
    },
});

export type Transaction = PgTransaction<BunSQLQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>;
export default db;
