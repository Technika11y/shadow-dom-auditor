// Maps auditor findings onto WCAG 2.2 success criteria, so a VPAT can be built from a real scan
// instead of someone's recollection.
//
// DELIBERATE LIMIT — automation can DISPROVE a criterion, it can never prove one. A criterion the
// auditor checked and found clean is NOT emitted as "Supports": a robot finding nothing is not a
// conformance claim, it's an absence of evidence. Those criteria stay unevaluated, which correctly
// sinks the overall claim in vpat-generator until a human evaluates them. Emitting "Supports" here
// would manufacture exactly the kind of authority this suite refuses to manufacture.
const CRITERION = {
  'aria-name-missing': '4.1.2',      // Name, Role, Value
  'aria-hidden-focusable': '4.1.2',
  'role-invalid': '4.1.2',
  'aria-idref-broken': '1.3.1',      // Info and Relationships
  'duplicate-id': '1.3.1',
  'img-role-no-name': '1.1.1',       // Non-text Content
  'tabindex-positive': '2.4.3',      // Focus Order
  // inline-event-handler / javascript-url are security smells with no WCAG criterion — excluded.
};

export function toVpatResults(findings) {
  const byCriterion = new Map();
  for (const f of findings) {
    const id = CRITERION[f.rule];
    if (!id) continue;
    if (!byCriterion.has(id)) byCriterion.set(id, []);
    byCriterion.get(id).push(f);
  }
  return [...byCriterion.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([id, fs]) => {
      const conformance = fs.some((f) => f.severity === 'error')
        ? 'Does Not Support'
        : 'Partially Supports';
      const detail = fs
        .map((f) => `${f.rule}${f.inShadow ? ' [shadow]' : ''}: ${f.message}`)
        .join('; ');
      return {
        id,
        conformance,
        remarks: `Automated scan (shadow-dom-auditor) found ${fs.length} issue(s) — ${detail}`,
      };
    });
}
