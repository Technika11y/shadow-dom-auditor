// Formatting + severity gating. No I/O here so it stays testable.
const RANK = { error: 0, warn: 1, info: 2 };

export function toJson(findings, meta) {
  return JSON.stringify({ meta, count: findings.length, findings }, null, 2);
}

export function toConsole(findings, meta) {
  const lines = [];
  lines.push(`shadow-dom-auditor — ${meta.url}`);
  lines.push(
    `${findings.length} finding(s), ${findings.filter((f) => f.inShadow).length} inside shadow roots`
  );
  const sorted = [...findings].sort(
    (a, b) => (RANK[a.severity] ?? 9) - (RANK[b.severity] ?? 9)
  );
  for (const f of sorted) {
    const badge = f.severity.toUpperCase().padEnd(5);
    const shadow = f.inShadow ? ' [shadow]' : '';
    lines.push(`  ${badge} ${f.rule}${shadow}  ${f.message}`);
    lines.push(`        at ${f.path}`);
  }
  return lines.join('\n');
}

export function worstSeverity(findings) {
  if (findings.some((f) => f.severity === 'error')) return 'error';
  if (findings.some((f) => f.severity === 'warn')) return 'warn';
  return 'none';
}
