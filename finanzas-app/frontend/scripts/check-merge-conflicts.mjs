import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../src/', import.meta.url);
const conflictPattern = /^(<<<<<<<|=======|>>>>>>>)/m;
const filesWithConflicts = [];

function walk(dirPath) {
  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!/\.(jsx?|tsx?|css|json)$/.test(entry)) continue;
    const content = readFileSync(fullPath, 'utf8');
    if (conflictPattern.test(content)) {
      filesWithConflicts.push(fullPath);
    }
  }
}

walk(ROOT.pathname);

if (filesWithConflicts.length > 0) {
  console.error('\n❌ Se detectaron marcadores de merge sin resolver:');
  for (const file of filesWithConflicts) {
    console.error(`- ${file}`);
  }
  console.error('\nResolvé los conflictos (<<<<<<<, =======, >>>>>>>) antes de ejecutar dev/build.\n');
  process.exit(1);
}

console.log('✅ Sin marcadores de merge en frontend/src.');
