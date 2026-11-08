// SARIF 2.1.0 output, so findings become real GitHub code-scanning alerts instead of
// console text. DOM paths have no line numbers, so the page is the artifact and the
// element path is carried as a logicalLocation — which is exactly what SARIF is for.
const LEVEL = { error: "error", warn: "warning", info: "note" };

export function toSarif(findings, meta = {}) {
  const ruleIds = [...new Set(findings.map((f) => f.rule))].sort();
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "shadow-dom-auditor",
            informationUri: "https://github.com/technika11y/shadow-dom-auditor",
            rules: ruleIds.map((id) => ({
              id,
              shortDescription: { text: id.replace(/-/g, " ") },
            })),
          },
        },
        results: findings.map((f) => ({
          ruleId: f.rule,
          level: LEVEL[f.severity] ?? "note",
          message: { text: f.inShadow ? `${f.message} (inside a shadow root)` : f.message },
          locations: [
            {
              physicalLocation: { artifactLocation: { uri: meta.url || "unknown" } },
              logicalLocations: [{ fullyQualifiedName: f.path || "unknown", kind: "element" }],
            },
          ],
        })),
      },
    ],
  };
}
