import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

build({
  entryPoints: [join(__dirname, '../public/sdk-bundle.js')],
  bundle: true,
  outfile: join(__dirname, '../public/sdk.min.js'),
  format: 'esm',
  minify: true,
}).catch(() => process.exit(1)); 