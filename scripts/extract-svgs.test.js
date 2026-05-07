import { test } from 'node:test';
import assert from 'node:assert';
import { toDisplayName, toCamelKey } from './extract-svgs.js';

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
  // Multiple dashes will result in the first character after dash being uppercased, and other dashes preserved if they precede a character
  // But due to the regex /-([a-z0-9])/g, multiple dashes might leave some.
  // Let's test current behavior. "a--b" -> "a-" + uppercase(b) = "a-B"
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
