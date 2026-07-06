import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAria } from '../src/checks/aria.js';

const node = (over = {}) => ({
  tag: 'div', role: null, id: null, attrs: {}, name: {},
  path: 'body > div', inShadow: false, ...over,
});

test('flags an interactive role with no accessible name', () => {
  const findings = checkAria([node({ tag: 'span', role: 'button' })]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'aria-name-missing');
  assert.equal(findings[0].severity, 'error');
});

test('accepts an interactive role that has an aria-label', () => {
  const findings = checkAria([node({ role: 'button', name: { ariaLabel: 'Save' } })]);
  assert.equal(findings.length, 0);
});

test('flags aria-labelledby pointing to a missing id', () => {
  const findings = checkAria(
    [node({ role: 'textbox', attrs: { 'aria-labelledby': 'ghost' }, name: { ariaLabel: 'x' } })],
    new Set()
  );
  assert.ok(findings.some((f) => f.rule === 'aria-idref-broken'));
});

test('notes shadow scope on a broken cross-root idref', () => {
  const findings = checkAria(
    [node({ role: 'textbox', inShadow: true, attrs: { 'aria-labelledby': 'ghost' }, name: { ariaLabel: 'x' } })],
    new Set()
  );
  const f = findings.find((x) => x.rule === 'aria-idref-broken');
  assert.match(f.message, /cross-root idrefs never resolve/);
});

test('resolves aria-labelledby when the id exists', () => {
  const findings = checkAria(
    [node({ role: 'textbox', attrs: { 'aria-labelledby': 'lbl' }, name: { ariaLabel: 'x' } })],
    new Set(['lbl'])
  );
  assert.equal(findings.filter((f) => f.rule === 'aria-idref-broken').length, 0);
});

test('flags positive tabindex', () => {
  const findings = checkAria([node({ attrs: { tabindex: '3' } })]);
  assert.ok(findings.some((f) => f.rule === 'tabindex-positive'));
});
