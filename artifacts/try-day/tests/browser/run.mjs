// Runs the task specs in this directory against the running app (see harness.mjs).
// With no arguments every spec runs; pass spec names (e.g. `setup filling`) to run a subset.
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const here = new URL('.', import.meta.url);
const wanted = process.argv.slice(2).map((name) => name.replace(/\.spec\.mjs$/, ''));
const specs = readdirSync(here)
  .filter((name) => name.endsWith('.spec.mjs'))
  .filter((name) => wanted.length === 0 || wanted.includes(name.replace(/\.spec\.mjs$/, '')))
  .sort();
if (specs.length === 0) {
  console.error(`No specs match: ${wanted.join(', ')}`);
  process.exit(1);
}
for (const name of specs) {
  await import(pathToFileURL(new URL(name, here).pathname).href);
}
