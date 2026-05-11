#!/usr/bin/env node
/**
 * extract-svgs.js
 *
 * Walks the category folders for optimized SVGs, parses each one,
 * and emits a single JSON catalog at dist/knitSymbols.json.
 *
 * Each entry preserves:
 *   - category + filename-derived key
 *   - viewBox (falls back to width/height or "0 0 100 100")
 *   - innerHTML: the raw inner SVG markup, rendered verbatim downstream
 *     so groups, masks, gradients, mixed strokes/fills, and authored
 *     fill/stroke attributes survive exactly as designed.
 *
 * Metadata from catalog.json (label, meaning, w, h) is merged in by
 * matching on { category, name }.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const CATEGORIES = ['basic', 'cable-v1', 'cable-v2'];
const outputDir = path.join(repoRoot, 'dist');
const outputFile = path.join(outputDir, 'knitSymbols.json');
const catalogFile = path.join(repoRoot, 'catalog.json');

export const toCamelKey = (category, name) => {
  const merged = `${category}-${name}`;
  return merged.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
};

export const toDisplayName = (name) =>
  name.split('-').map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p)).join(' ');

const logNote = (items, label) => {
  if (!items.length) return;
  console.warn(`  Note: ${items.length} ${label}`);
  for (const k of items) console.warn(`    - ${k}`);
};

const loadCatalogIndex = async () => {
  try {
    const raw = JSON.parse(await fs.readFile(catalogFile, 'utf8'));
    const idx = new Map();
    for (const entry of raw) {
      idx.set(`${entry.category}/${entry.name}`, entry);
    }
    return idx;
  } catch (err) {
    if (err.code === 'ENOENT') return new Map();
    throw err;
  }
};

// Shape elements that carry presentation attributes we care about.
const SHAPE_TAGS = new Set([
  'path', 'circle', 'rect', 'ellipse', 'polygon', 'polyline', 'line', 'use', 'g',
]);

// Normalize each shape so that filled glyphs don't accidentally inherit the
// wrapper's stroke (which would double-outline letter-style symbols like M,
// P, ML, MR, B, etc.). Rule:
//   - If element has fill="none", it's a stroke-only shape: leave alone.
//   - Otherwise (explicit fill OR no fill attribute → inherits), it's a
//     filled glyph; force stroke="none" unless the author set their own.
const normalizeStrokes = ($, root) => {
  root.find('*').each((_, el) => {
    if (!SHAPE_TAGS.has(el.tagName)) return;
    const $el = $(el);
    const fill = $el.attr('fill');
    const stroke = $el.attr('stroke');
    if (fill === 'none') return;
    if (stroke == null) $el.attr('stroke', 'none');
  });
};

const extractFromFile = async (filePath, category, name) => {
  const svgContent = await fs.readFile(filePath, 'utf8');
  const $ = cheerio.load(svgContent, { xmlMode: true });
  const svg = $('svg').first();

  if (!svg.length) {
    throw new Error(`No <svg> root in ${filePath}`);
  }

  let viewBox = svg.attr('viewBox');
  if (!viewBox) {
    const w = svg.attr('width');
    const h = svg.attr('height');
    viewBox = w && h ? `0 0 ${parseFloat(w)} ${parseFloat(h)}` : '0 0 100 100';
  }

  normalizeStrokes($, svg);

  return {
    key: toCamelKey(category, name),
    category,
    name,
    file: `${category}/${name}.svg`,
    displayName: toDisplayName(name),
    viewBox,
    innerHTML: svg.html() ?? '',
  };
};

const main = async () => {
  const catalogIndex = await loadCatalogIndex();
  const symbols = {};
  let count = 0;
  const missingFromCatalog = [];

  const categoryPromises = CATEGORIES.map(async (category) => {
    const dir = path.join(repoRoot, category);
    try {
      const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.svg')).sort();
      const filePromises = files.map(async (file) => {
        const name = file.replace(/\.svg$/, '');
        const data = await extractFromFile(path.join(dir, file), category, name);

        const meta = catalogIndex.get(`${category}/${name}`);
        if (meta) {
          data.label = meta.label;
          data.meaning = meta.meaning;
          if (meta.aliases) data.aliases = meta.aliases;
          if (meta.w) data.cellWidth = meta.w;
          if (meta.h) data.cellHeight = meta.h;
        } else {
          missingFromCatalog.push(`${category}/${name}`);
        }
        return data;
      });
      return await Promise.all(filePromises);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn(`(skip) missing category folder: ${category}`);
        return [];
      }
      throw err;
    }
  });

  const results = await Promise.all(categoryPromises);
  for (const categoryResults of results) {
    for (const data of categoryResults) {
      symbols[data.key] = data;
      count++;
    }
  }

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(symbols, null, 2) + '\n');

  console.log(`Extracted ${count} symbols → ${path.relative(repoRoot, outputFile)}`);
  logNote(missingFromCatalog, 'SVG(s) without catalog.json metadata:');

  // Cross-check: catalog entries with no SVG file present.
  const orphanCatalog = [];
  const orphanPromises = [];
  for (const [k] of catalogIndex) {
    const [c, n] = k.split('/');
    const expected = path.join(repoRoot, c, `${n}.svg`);
    orphanPromises.push(
      fs.access(expected)
        .then(() => true)
        .catch(() => { orphanCatalog.push(k); return false; })
    );
  }
  await Promise.all(orphanPromises);
  logNote(orphanCatalog, 'catalog entr(y/ies) with no SVG export yet:');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
