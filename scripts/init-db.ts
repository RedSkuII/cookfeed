// Database initialization script
// Run this once after setting up your Turso database
// Usage: npx tsx scripts/init-db.ts

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { initializeDatabase } from '../src/lib/db';

async function main() {
  console.log('🗄️  Initializing CookFeed database...\n');
  
  try {
    await initializeDatabase();
    console.log('\n✅ Database initialized successfully!');
    console.log('\nTables created:');
    console.log('  - users');
    console.log('  - recipes');
    console.log('  - comments');
    console.log('  - favorites');
    console.log('  - likes');
    console.log('  - made_recipes');
    console.log('  - collections');
    console.log('  - followers');
    console.log('\nYou can now start the app with: npm run dev');
  } catch (error) {
    console.error('\n❌ Error initializing database:', error);
    process.exit(1);
  }
}

main();
