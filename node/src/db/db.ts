import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, type BunSQLQueryResultHKT } from "drizzle-orm/bun-sql";
import { customType, PgTransaction } from "drizzle-orm/pg-core";

const userdata = `${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}`;
const host = `${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`;
const URL = `postgres://${userdata}@${host}/${process.env.POSTGRES_DB}`;

const db = drizzle(URL);

export const bytea = customType<{
    data: Buffer;
    default: false;
}>({
    dataType() {
        return "bytea";
    },
});

export type Transaction = PgTransaction<BunSQLQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>;
export default db;
