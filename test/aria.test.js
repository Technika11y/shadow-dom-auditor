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

test('flags aria-hidden on a focusable element', () => {
  const findings = checkAria([node({ tag: 'button', attrs: { 'aria-hidden': 'true' } })]);
  assert.ok(findings.some((f) => f.rule === 'aria-hidden-focusable' && f.severity === 'error'));
});

test('aria-hidden on a non-focusable element is fine', () => {
  const findings = checkAria([node({ tag: 'div', attrs: { 'aria-hidden': 'true' } })]);
  assert.equal(findings.filter((f) => f.rule === 'aria-hidden-focusable').length, 0);
});

test('aria-hidden with tabindex="-1" is not flagged (removed from tab order)', () => {
  const findings = checkAria([node({ tag: 'button', attrs: { 'aria-hidden': 'true', tabindex: '-1' } })]);
  assert.equal(findings.filter((f) => f.rule === 'aria-hidden-focusable').length, 0);
});

test('flags an invalid ARIA role', () => {
  const findings = checkAria([node({ role: 'buton', name: { text: 'x' } })]);
  assert.ok(findings.some((f) => f.rule === 'role-invalid'));
});

test('accepts a valid ARIA role', () => {
  const findings = checkAria([node({ role: 'navigation' })]);
  assert.equal(findings.filter((f) => f.rule === 'role-invalid').length, 0);
});

test('flags role="img" with no accessible name', () => {
  const findings = checkAria([node({ role: 'img' })]);
  assert.ok(findings.some((f) => f.rule === 'img-role-no-name'));
});

test('role="img" with an aria-label passes', () => {
  const findings = checkAria([node({ role: 'img', name: { ariaLabel: 'Logo' } })]);
  assert.equal(findings.filter((f) => f.rule === 'img-role-no-name').length, 0);
});

test('flags a duplicate id in the light DOM', () => {
  const findings = checkAria([node({ id: 'dup', path: 'a' }), node({ id: 'dup', path: 'b' })]);
  assert.ok(findings.some((f) => f.rule === 'duplicate-id'));
});

test('same id across shadow roots is not a duplicate (encapsulated)', () => {
  const findings = checkAria([
    node({ id: 'x', inShadow: true, path: 'a' }),
    node({ id: 'x', inShadow: true, path: 'b' }),
  ]);
  assert.equal(findings.filter((f) => f.rule === 'duplicate-id').length, 0);
});
