import test from 'node:test';
import assert from 'node:assert/strict';
import { toSarif } from '../src/sarif.js';

const f = (over = {}) => ({
  rule: 'aria-name-missing', severity: 'error', message: 'no name',
  path: 'body > button', inShadow: false, ...over,
});

test('emits a valid SARIF 2.1.0 envelope', () => {
  const s = toSarif([f()], { url: 'https://example.com' });
  assert.equal(s.version, '2.1.0');
  assert.match(s.$schema, /sarif-2\.1\.0/);
  assert.equal(s.runs.length, 1);
  assert.equal(s.runs[0].tool.driver.name, 'shadow-dom-auditor');
});

test('maps our severities onto SARIF levels', () => {
  const s = toSarif([f({ severity: 'error' }), f({ severity: 'warn' }), f({ severity: 'info' })], {});
  assert.deepEqual(s.runs[0].results.map((r) => r.level), ['error', 'warning', 'note']);
});

test('declares each rule exactly once in the driver', () => {
  const s = toSarif([f(), f(), f({ rule: 'tabindex-positive', severity: 'warn' })], {});
  assert.deepEqual(s.runs[0].tool.driver.rules.map((r) => r.id), ['aria-name-missing', 'tabindex-positive']);
});

test('page is the artifact, DOM path is a logicalLocation', () => {
  const s = toSarif([f({ path: 'body > my-widget > input' })], { url: 'https://example.com/x' });
  const loc = s.runs[0].results[0].locations[0];
  assert.equal(loc.physicalLocation.artifactLocation.uri, 'https://example.com/x');
  assert.equal(loc.logicalLocations[0].fullyQualifiedName, 'body > my-widget > input');
});

test('shadow-root findings say so in the message', () => {
  const s = toSarif([f({ inShadow: true })], {});
  assert.match(s.runs[0].results[0].message.text, /inside a shadow root/);
});
