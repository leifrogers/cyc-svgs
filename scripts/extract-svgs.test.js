import { test } from 'node:test';
import assert from 'node:assert';
import { toDisplayName, toCamelKey, extractFromSVG } from './extract-svgs.js';

test('toCamelKey should convert category and name to camelCase', () => {
  assert.strictEqual(toCamelKey('basic', 'knit'), 'basicKnit');
  assert.strictEqual(toCamelKey('cable-v1', 'cross-left'), 'cableV1CrossLeft');
});

test('toCamelKey should handle strings with numbers', () => {
  assert.strictEqual(toCamelKey('cable-v2', '2x2-cross'), 'cableV22x2Cross');
});

test('toCamelKey should handle empty strings', () => {
  assert.strictEqual(toCamelKey('', ''), '-');
  assert.strictEqual(toCamelKey('basic', ''), 'basic-');
  assert.strictEqual(toCamelKey('', 'knit'), 'Knit');
});

test('toCamelKey should handle consecutive dashes correctly', () => {
  assert.strictEqual(toCamelKey('a', '-b'), 'a-B');
});

test('toDisplayName should capitalize and replace dashes with spaces', () => {
  assert.strictEqual(toDisplayName('knit'), 'Knit');
  assert.strictEqual(toDisplayName('purl'), 'Purl');
  assert.strictEqual(toDisplayName('slip-stitch'), 'Slip Stitch');
  assert.strictEqual(toDisplayName('knit-two-together'), 'Knit Two Together');
});

test('toDisplayName should handle already capitalized words', () => {
  assert.strictEqual(toDisplayName('Knit'), 'Knit');
  assert.strictEqual(toDisplayName('Slip-Stitch'), 'Slip Stitch');
});

test('toDisplayName should handle multiple dashes', () => {
  assert.strictEqual(toDisplayName('a-b-c'), 'A B C');
});

test('toDisplayName should handle empty string', () => {
  assert.strictEqual(toDisplayName(''), '');
});

test('toDisplayName should handle strings with leading/trailing dashes', () => {
  assert.strictEqual(toDisplayName('-a-'), ' A ');
});

test('toDisplayName should handle numeric parts', () => {
  assert.strictEqual(toDisplayName('cable-4-back'), 'Cable 4 Back');
});

test('extractFromSVG should use viewBox if present', () => {
  const svgContent = '<svg viewBox="0 0 50 50"><path d="M0 0h50v50H0z"/></svg>';
  const result = extractFromSVG(svgContent, 'test', 'icon', 'test/icon.svg');
  assert.strictEqual(result.viewBox, '0 0 50 50');
});

test('extractFromSVG should fallback to width and height if viewBox is missing', () => {
  const svgContent = '<svg width="80" height="60"><path d="M0 0h80v60H0z"/></svg>';
  const result = extractFromSVG(svgContent, 'test', 'icon', 'test/icon.svg');
  assert.strictEqual(result.viewBox, '0 0 80 60');
});

test('extractFromSVG should fallback to 0 0 100 100 if viewBox, width, and height are missing', () => {
  const svgContent = '<svg><path d="M0 0h100v100H0z"/></svg>';
  const result = extractFromSVG(svgContent, 'test', 'icon', 'test/icon.svg');
  assert.strictEqual(result.viewBox, '0 0 100 100');
});

test('extractFromSVG should throw error if no svg root is found', () => {
  const svgContent = '<div>Not an SVG</div>';
  assert.throws(() => {
    extractFromSVG(svgContent, 'test', 'icon', 'test/icon.svg');
  }, /No <svg> root in test\/icon.svg/);
});
