declare global {
    declare namespace NodeJS {
        interface ProcessEnv {
            POSTGRES_USER: string;
            POSTGRES_PASSWORD: string;
            POSTGRES_DB: string;
            POSTGRES_PORT: string;
            POSTGRES_URL: string;

            REDIS_URL: string;

            STORAGE_ENDPOINT: string;
            STORAGE_REGION: string;
            STORAGE_ACCESS_KEY: string;
            STORAGE_SECRET_KEY: string;
            STORAGE_BUCKET: string;

            APP_ENCRYPTION_KEY: string;

            NODE_HOST: string;
            NODE_PORT: string;
            RUST_HOST: string;
            RUST_PORT: string;
        }
    }
}

export {};
