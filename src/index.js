#!/usr/bin/env node
// Technika11y — Shadow-DOM Auditor CLI
// Root access for everyone.
import { crawl } from './crawler.js';
import { checkAria } from './checks/aria.js';
import { checkXss } from './checks/xss.js';
import { toJson, toConsole, worstSeverity } from './report.js';

function parseArgs(argv) {
  const args = { url: null, json: false, failOn: 'error' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--fail-on') args.failOn = argv[++i];
    else if (!a.startsWith('-')) args.url = a;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    console.error('usage: shadow-dom-auditor <url> [--json] [--fail-on error|warn|none]');
    process.exit(2);
  }

  const nodes = await crawl(args.url);
  const ids = new Set(nodes.map((n) => n.id).filter(Boolean));
  const findings = [...checkAria(nodes, ids), ...checkXss(nodes)];
  const meta = {
    url: args.url,
    scanned: nodes.length,
    shadowRoots: nodes.filter((n) => n.inShadow).length,
  };

  console.log(args.json ? toJson(findings, meta) : toConsole(findings, meta));

  const worst = worstSeverity(findings);
  const fail =
    (args.failOn === 'error' && worst === 'error') ||
    (args.failOn === 'warn' && worst !== 'none');
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
