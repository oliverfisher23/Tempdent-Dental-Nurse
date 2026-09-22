import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * The dependency direction between the three halves of `src/`:
 *
 *   client  ->  shell  ->  kit
 *
 * `src/kit/` is reusable pieces (UI primitives, audio, hooks) that know nothing
 * about a try day. `src/shell/` runs a day for whichever client it is handed
 * through context, and knows nothing about kitchens. `src/client/` is one
 * employer's day: content, scenes, pages and pictures. The composition root,
 * `src/main.tsx`, is the only place the two halves meet.
 *
 * When a new client is remixed from this project, its `src/client/` is replaced
 * wholesale and `src/shell/` and `src/kit/` are pulled forward unchanged. Any
 * import from shell or kit into client, or from kit into shell, is a piece of
 * the kitchen leaking into the template, and would break the next client's
 * build the moment the kitchen files are gone.
 */

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(projectRoot, 'src');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [full] : [];
    }),
  );
  return files.flat();
}

/** Every module specifier a file imports, re-exports, dynamically imports or globs. */
function specifiersIn(source: string): string[] {
  const out: string[] = [];
  const patterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\.meta\.glob\s*\(\s*['"]([^'"]+)['"]/g,
    /@import\s*['"]([^'"]+)['"]/g,
    /\burl\(\s*['"]?([^'")]+)['"]?\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) out.push(match[1]);
  }
  return out;
}

/** Which half of src/ a specifier lands in, or null when it is a package or leaves src/. */
function halfOf(specifier: string, fromFile: string): 'shell' | 'kit' | 'client' | null {
  const aliases: Record<string, 'shell' | 'kit' | 'client'> = { '@shell/': 'shell', '@kit/': 'kit', '@client/': 'client' };
  for (const [prefix, half] of Object.entries(aliases)) {
    if (specifier.startsWith(prefix)) return half;
  }
  if (specifier.startsWith('@assets/')) return 'client';
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const resolved = specifier.startsWith('/')
      ? path.join(projectRoot, specifier)
      : path.resolve(path.dirname(fromFile), specifier);
    const relative = path.relative(srcDir, resolved);
    if (relative.startsWith('..')) return null;
    const [head] = relative.split(path.sep);
    return head === 'shell' || head === 'kit' || head === 'client' ? head : null;
  }
  return null;
}

async function violations(half: 'shell' | 'kit', forbidden: Array<'shell' | 'client'>): Promise<string[]> {
  const found: string[] = [];
  for (const file of await sourceFiles(path.join(srcDir, half))) {
    const source = await readFile(file, 'utf8');
    for (const specifier of specifiersIn(source)) {
      const target = halfOf(specifier, file);
      if (target && forbidden.includes(target as 'shell' | 'client')) {
        found.push(`${path.relative(projectRoot, file)} imports ${specifier}`);
      }
    }
  }
  return found;
}

test('nothing in src/shell imports from src/client', async () => {
  const found = await violations('shell', ['client']);
  assert.deepEqual(found, [], `The shell must reach client data through useClient(), never by import:\n${found.join('\n')}`);
});

test('nothing in src/kit imports from src/shell or src/client', async () => {
  const found = await violations('kit', ['shell', 'client']);
  assert.deepEqual(found, [], `The kit is reusable on its own and must not depend on the shell or a client:\n${found.join('\n')}`);
});

test('the shell and kit carry no kitchen names or kitchen assets', async () => {
  // Names, ids and asset paths that belong to this client's day. Any of them in
  // the shell or the kit is client knowledge that should be reaching them
  // through the TryClient contract instead, and would be wrong for the next
  // client the moment src/client is swapped.
  const kitchenMarks = [
    /art'otel/i,
    /artotel/i,
    /Hoxton/,
    /Terence/,
    /Yvie/,
    /Marcus/,
    /Elena/,
    /take-the-handover/,
    /check-the-delivery-in/,
    /chill-the-event-batch/,
    /check-the-dietary-list/,
    /hand-the-kitchen-on/,
    /kitchen-ambience/,
    /assets\/kitchen/,
    /@assets\//,
  ];
  const found: string[] = [];
  for (const half of ['shell', 'kit'] as const) {
    for (const file of await sourceFiles(path.join(srcDir, half))) {
      const source = await readFile(file, 'utf8');
      for (const mark of kitchenMarks) {
        if (mark.test(source)) found.push(`${path.relative(projectRoot, file)} mentions ${mark.source}`);
      }
    }
  }
  assert.deepEqual(found, [], found.join('\n'));
});
