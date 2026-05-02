import { test } from 'node:test';
import assert from 'node:assert';
import { toDisplayName } from './extract-svgs.js';

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
