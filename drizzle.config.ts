import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local' })

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Better Auth owns user/session/account/verification but they are declared in
  // our schema so Drizzle manages them in one migration history (§5).
  verbose: true,
  strict: true,
})
