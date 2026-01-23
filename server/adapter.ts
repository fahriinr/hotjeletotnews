import { drizzle } from "drizzle-orm/postgres-js";

import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import postgres from "postgres";
import { z } from "zod";

import { sessionTable, userTable } from "./db/schemas/auth";

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
});

const processEnv = EnvSchema.parse(process.env);

// Optimize connection pooling for better performance
const queryClient = postgres(processEnv.DATABASE_URL, {
  prepare: true, // Enable prepared statements for better performance
});
export const db = drizzle(queryClient, {
  schema: {
    user: userTable,
    session: sessionTable,
  },
});

export const adapter = new DrizzlePostgreSQLAdapter(
  db,
  sessionTable,
  userTable,
);
