import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

const requiredEnvVars = ['VITE_API_BASE_URL'];

function validateEnv() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.error('Please create a .env file with VITE_API_BASE_URL');
    process.exit(1);
  }

  config();

  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

function generateTypes() {
  console.log('🔨 Generating API types...');
  try {
    execSync('npm run api:types', { stdio: 'inherit' });
    console.log('✅ Types generated');
  } catch (error) {
    console.warn('⚠️  Type generation failed (API might not be running yet)');
    console.warn('   You can run "npm run api:types" manually later');
  }
}

function startDev() {
  console.log('🚀 Starting Vite dev server...');
  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🏃 Starting dev-run script...\n');

  validateEnv();
  generateTypes();
  startDev();
}

main();

