const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const projectRoot = process.cwd();
const envFiles = ['.env', '.env.local', '.env.production', '.env.production.local'];
const merged = {};

for (const file of envFiles) {
  const fullPath = path.join(projectRoot, file);
  if (!fs.existsSync(fullPath)) continue;
  const parsed = dotenv.parse(fs.readFileSync(fullPath));
  Object.assign(merged, parsed);
}

const configured = process.env.VITE_API_BASE_URL || merged.VITE_API_BASE_URL || '';
const value = String(configured).trim();
const allowLocalhost = process.env.ALLOW_LOCALHOST_API === '1' || process.env.ALLOW_LOCALHOST_API === 'true';
const localhostPattern = /(^|:\/\/)(localhost|127(?:\.\d{1,3}){3})(?::\d+)?(\/|$)/i;

if (!value) {
  console.log('[validate-api-env] VITE_API_BASE_URL not set. Production default will use same-origin /api.');
  process.exit(0);
}

if (localhostPattern.test(value) && !allowLocalhost) {
  console.error(
    `[validate-api-env] Invalid VITE_API_BASE_URL for production build: "${value}". ` +
      'Use "/api" (same-origin) or a real API hostname.',
  );
  console.error('[validate-api-env] If this is intentional for local testing, set ALLOW_LOCALHOST_API=1.');
  process.exit(1);
}

console.log(`[validate-api-env] OK: VITE_API_BASE_URL="${value}"`);
