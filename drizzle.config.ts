import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Memastikan variabel env terbaca
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './db/schema.ts', 
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!, 
  },
});