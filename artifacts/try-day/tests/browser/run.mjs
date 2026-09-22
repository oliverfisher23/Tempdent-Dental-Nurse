// Runs every task spec in this directory against the running app (see harness.mjs).
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const here = new URL('.', import.meta.url);
const specs = readdirSync(here).filter((name) => name.endsWith('.spec.mjs')).sort();
for (const name of specs) {
  await import(pathToFileURL(new URL(name, here).pathname).href);
}
