# Contributing

Thanks for helping make the web both safer and more usable.

## Ground rules

- **Honesty contract:** the status table in the README must always match reality. A PR that adds a
  capability updates that table in the same change; a PR must never make a claim the code doesn't
  back.
- **License:** contributions are accepted under [Apache-2.0](LICENSE).
- **Sign-off (DCO):** commit with `git commit -s` to certify you wrote the change and can
  contribute it.

## Dev loop

```bash
npm install
npx playwright install chromium
npm test            # node --test, no browser needed for unit tests
node src/index.js https://example.com
```

## Design conventions

- **Checks are pure functions** over node descriptors (`src/checks/*`) so they unit-test without a
  browser. Keep browser-only logic in `src/browser/` and glue in `src/crawler.js`.
- Every new check ships with a unit test and a row in the README status table.
- Findings use `{ rule, severity, message, path, inShadow }`. Severities: `error`, `warn`, `info`.

## What makes a good check

The suite's edge is the **intersection** of security and accessibility. Prefer checks that only a
shadow-piercing, dual-lens tool can make (e.g. cross-root idref breakage, slot-projected injection)
over ones that mature single-purpose scanners already do well.
