# Shadow-DOM Auditor

> Pierces shadow DOM to surface **accessibility defects and injection-sink smells that
> conventional scanners walk right past** — because most crawlers never cross a shadow boundary.
>
> Part of the **Technika11y** suite · *Root access for everyone.*

[![ci](https://github.com/technika11y/shadow-dom-auditor/actions/workflows/ci.yml/badge.svg)](https://github.com/technika11y/shadow-dom-auditor/actions/workflows/ci.yml)
![status](https://img.shields.io/badge/status-pre--alpha-orange)
![license](https://img.shields.io/badge/license-Apache--2.0-blue)

---

## Quick start

```bash
git clone https://github.com/technika11y/shadow-dom-auditor && cd shadow-dom-auditor
npm install
npx playwright install chromium
node src/index.js https://example.com
```

## Status — read this first

**Pre-alpha (`v0.1.0-alpha`). Honest state of the code:**

| Capability | State |
|---|---|
| Shadow-DOM traversal (pierces open shadow roots, recursively) | ✅ works |
| ARIA: interactive role missing an accessible name | ✅ works |
| ARIA: `aria-labelledby`/`aria-describedby` → missing id (incl. **cross-root idref** detection) | ✅ works |
| ARIA: positive `tabindex` focus-order smell | ✅ works |
| ARIA: `aria-hidden` on a focusable element (keyboard-reachable but AT-invisible) | ✅ works |
| ARIA: invalid role token, unnamed `role="img"`, duplicate light-DOM `id` | ✅ works |
| Injection smells: inline event handlers, `javascript:` URLs | ✅ works (heuristic) |
| Real DOM-XSS taint tracking (source→sink dataflow) | ⚠️ **not built** — [roadmap](#roadmap) |
| Closed shadow roots | ❌ out of scope (not reachable by design) |

This table is the project's honesty contract: it says exactly what runs and what doesn't. If a
row here ever overstates the code, that's a bug — file it.

## Why it exists

Two different tools normally have to look at a page — a security scanner and an accessibility
checker — and **both** typically stop at the shadow boundary. Web Components hide real defects in
there:

- an `aria-labelledby` inside a shadow root **can never resolve** to an id in the light DOM (or
  another shadow root) — a whole class of broken names that light-DOM checkers can't even see;
- inline event handlers and `javascript:` URLs injected into a component's shadow template are
  invisible to a crawler that doesn't descend.

Shadow-DOM Auditor descends, and reports both classes from one pass — the thesis of the whole
suite (*security and accessibility are one discipline*) in running code.

## Install

```bash
npm install
npx playwright install chromium   # one-time browser download
```

## Usage

```bash
# human-readable
node src/index.js https://example.com

# machine-readable, and fail CI on any error-severity finding
node src/index.js https://example.com --json --fail-on error
```

Exit codes: `0` clean (per `--fail-on`), `1` threshold exceeded, `2` usage/runtime error — so it
drops straight into a pipeline.

Example output:

```
shadow-dom-auditor — https://example.com
3 finding(s), 2 inside shadow roots
  ERROR aria-idref-broken [shadow]  aria-labelledby="title" points to an id that does not exist (shadow-DOM scope — cross-root idrefs never resolve)
        at body > my-widget > input
  WARN  inline-event-handler [shadow]  inline onclick= handler — blocks a strict CSP and is a classic injection sink
        at body > my-widget > button
```

## Authorized use only

This tool loads and inspects pages you point it at. **Only scan properties you own or are
explicitly authorized to test.** It is a defensive auditing tool; the injection checks are
smell-flags for a human reviewer, not confirmed exploits, and it performs no exploitation.

## Roadmap

- [ ] DOM-XSS taint tracking (source → sink dataflow), replacing the current heuristic smells
- [ ] Slot-projection analysis (light-DOM content assigned into shadow slots)
- [ ] `axe-core` rule bridge for full WCAG mapping
- [ ] SARIF output for GitHub code scanning
- [ ] `--budget` gate for the shared Technika11y CI template

## License

[Apache-2.0](LICENSE). See [`SECURITY.md`](SECURITY.md) for responsible disclosure and
[`CONTRIBUTING.md`](CONTRIBUTING.md) to get started.

---

**Part of the [Technika11y](https://github.com/technika11y) suite** · [technika11y.github.io](https://technika11y.github.io/) · security, compliance, and accessibility as one discipline.
