import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await rm(`${root}dist`, { recursive: true, force: true });
await mkdir(`${root}dist`, { recursive: true });
for (const name of ['index.html', 'styles', 'assets', 'src']) await cp(`${root}${name}`, `${root}dist/${name}`, { recursive: true });
await writeFile(`${root}dist/.nojekyll`, '');
console.log('Built dist/ — static files only, no CDN or runtime dependencies.');
