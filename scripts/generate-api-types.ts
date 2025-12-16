import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

async function generateTypes() {
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3011/api/v1 ';
  const outputDir = path.join(process.cwd(), 'src', 'api', 'generated');
  const outputFile = path.join(outputDir, 'types.ts');

  console.log('📥 Fetching OpenAPI schema...');

  try {
    // Try to fetch from running API
    const response = await axios.get(`${apiBaseUrl}/api/docs-json`);
    const schema = response.data;

    // Write schema to temp file for openapi-typescript
    const tempSchemaFile = path.join(process.cwd(), 'openapi-temp.json');
    fs.writeFileSync(tempSchemaFile, JSON.stringify(schema, null, 2));

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🔨 Generating TypeScript types...');
    execSync(
      `npx openapi-typescript ${tempSchemaFile} -o ${outputFile}`,
      { stdio: 'inherit' },
    );

    // Clean up temp file
    fs.unlinkSync(tempSchemaFile);

    console.log(`✅ Types generated at ${outputFile}`);
  } catch (error: any) {
    console.error('❌ Failed to generate types:', error.message);
    console.log('💡 Make sure the API is running at', apiBaseUrl);
    process.exit(1);
  }
}

generateTypes();



