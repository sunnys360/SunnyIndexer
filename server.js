/**
 * Hostinger & Node.js Production Entry Point
 * Loads the compiled server bundle from dist/server.cjs
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const distServer = join(__dirname, 'dist', 'server.cjs');

if (existsSync(distServer)) {
  require(distServer);
} else {
  console.error('❌ Build artifact dist/server.cjs not found.');
  console.error('Please ensure "npm run build" is executed during deployment before running server.js.');
  process.exit(1);
}
