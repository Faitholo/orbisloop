import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL!;

// Use postgres.js for local development; Neon HTTP adapter for production/Neon URLs
function createDb() {
  if (DATABASE_URL.includes("neon.tech") || DATABASE_URL.includes("neon.database")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { neon } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/neon-http");
    return drizzle(neon(DATABASE_URL), { schema });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const postgres = require("postgres");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/postgres-js");
    return drizzle(postgres(DATABASE_URL), { schema });
  }
}

export const db = createDb();

export * from "./schema";
