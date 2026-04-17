import { drizzle } from "drizzle-orm/bun-sql";
import { customType } from "drizzle-orm/pg-core";

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
export default db;
