import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

let envPath = path.join(process.cwd(), 'apps', 'backend', '.env.local');

if (!fs.existsSync(envPath)) {
  envPath = path.join(process.cwd(), '.env.local');
}
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(__dirname, '../.env.local');
}

console.log('Loading env file from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading env file:', result.error);
}
