#!/usr/bin/env node
/**
 * Reproduce the web-ready WebP exports of the client's kitchen photographs.
 *
 * Reads `src/client/content/kitchen-photos.json` (source file in the zip, crop, size,
 * quality and any redactions per export), unpacks only the named photographs
 * from the archive (the `__MACOSX` resource forks are never touched), then for
 * each export: auto-orients, strips all metadata, blurs any redacted regions,
 * crops, resizes and writes WebP into `src/client/assets/kitchen/photos/`.
 *
 * Crop and redaction geometries are ImageMagick `WxH+X+Y` rectangles measured
 * on the auto-oriented source (4240x2384 for the landscape frames, 2384x4240
 * for the portrait).
 *
 * Usage: node scripts/prepare-kitchen-photos.mjs [path/to/Images.zip]
 * Needs `unzip` and ImageMagick 7 (`magick`) on the PATH.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(projectRoot, '../..');
const manifestPath = path.join(projectRoot, 'src/client/content/kitchen-photos.json');
const MAX_WIDTH = 1920;

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

function parseSize(size) {
  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) throw new Error(`Bad size "${size}", expected WxH`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const archive = path.resolve(process.argv[2] ?? path.join(workspaceRoot, manifest.archive));
  const outputDir = path.join(projectRoot, manifest.outputDir);
  const exports = Object.entries(manifest.exports);
  const sources = [...new Set(exports.map(([, spec]) => spec.source))];
  for (const source of sources) {
    if (source.includes('__MACOSX') || path.basename(source).startsWith('._')) {
      throw new Error(`Manifest must name the photograph itself, not a resource fork: ${source}`);
    }
  }

  mkdirSync(outputDir, { recursive: true });
  const temp = mkdtempSync(path.join(tmpdir(), 'kitchen-photos-'));
  try {
    // -j drops the "Images/" folder; only the listed photographs are extracted.
    run('unzip', ['-o', '-q', '-j', archive, ...sources, '-d', temp]);

    let total = 0;
    for (const [key, spec] of exports) {
      const { width, height } = parseSize(spec.size);
      if (width > MAX_WIDTH) throw new Error(`${key}: ${spec.size} is wider than ${MAX_WIDTH}px`);
      const input = path.join(temp, path.basename(spec.source));
      const output = path.join(outputDir, spec.file);

      const args = [input, '-auto-orient', '-strip'];
      for (const region of spec.redact ?? []) {
        const offset = /(\+\d+\+\d+)$/.exec(region)?.[1];
        if (!offset) throw new Error(`${key}: bad redaction geometry "${region}"`);
        // Blur a copy of the region and lay it back where it came from.
        args.push('(', '+clone', '-crop', region, '+repage', '-blur', '0x30', ')', '-geometry', offset, '-composite');
      }
      if (spec.crop) args.push('-crop', spec.crop, '+repage');
      args.push('-resize', `${width}x${height}^`, '-gravity', 'center', '-extent', `${width}x${height}`);
      // Small exports shown near 1:1 lose detail in the big downscale; a light unsharp brings it back.
      if (spec.sharpen) args.push('-unsharp', '0x0.75+0.75+0.008');
      args.push('-quality', String(spec.quality), '-define', 'webp:method=6', output);
      run('magick', args);

      const [w, h, format] = run('magick', ['identify', '-format', '%w %h %m', output]).trim().split(' ');
      if (Number(w) !== width || Number(h) !== height || format !== 'WEBP') {
        throw new Error(`${key}: wrote ${w}x${h} ${format}, expected ${spec.size} WEBP`);
      }
      const bytes = statSync(output).size;
      total += bytes;
      console.log(`${spec.file.padEnd(26)} ${spec.size.padEnd(10)} ${(bytes / 1024).toFixed(0).padStart(5)} KB  <- ${spec.source}`);
    }
    console.log(`${'total'.padEnd(37)} ${(total / 1024).toFixed(0).padStart(5)} KB`);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

main();
