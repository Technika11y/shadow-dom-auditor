import test from 'node:test';
import assert from 'node:assert/strict';
import { toVpatResults } from '../src/wcag.js';

const f = (over = {}) => ({
  rule: 'aria-name-missing', severity: 'error', message: 'no name',
  path: 'body > button', inShadow: false, ...over,
});

test('an error maps the criterion to Does Not Support', () => {
  const [r] = toVpatResults([f()]);
  assert.equal(r.id, '4.1.2');
  assert.equal(r.conformance, 'Does Not Support');
});

test('warning-only findings map to Partially Supports', () => {
  const [r] = toVpatResults([f({ rule: 'tabindex-positive', severity: 'warn' })]);
  assert.equal(r.id, '2.4.3');
  assert.equal(r.conformance, 'Partially Supports');
});

test('a clean scan claims NOTHING — automation cannot prove conformance', () => {
  assert.deepEqual(toVpatResults([]), []);
});

test('security-only findings are excluded (no WCAG criterion)', () => {
  assert.deepEqual(toVpatResults([f({ rule: 'inline-event-handler', severity: 'warn' })]), []);
});

test('several findings collapse onto one criterion, worst severity wins', () => {
  const out = toVpatResults([
    f({ rule: 'role-invalid', severity: 'error' }),
    f({ rule: 'aria-hidden-focusable', severity: 'error' }),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, '4.1.2');
  assert.match(out[0].remarks, /found 2 issue\(s\)/);
});

test('remarks carry the evidence, including shadow scope', () => {
  const [r] = toVpatResults([f({ rule: 'aria-idref-broken', inShadow: true, message: 'broken ref' })]);
  assert.match(r.remarks, /\[shadow\]/);
  assert.match(r.remarks, /broken ref/);
});
