// Injection-SMELL heuristics from static attributes only. This is intentionally shallow:
// confirmed DOM-XSS needs source->sink taint tracking (planned — see README roadmap). These
// flags mark things a human reviewer should look at, NOT confirmed vulnerabilities.
function finding(rule, severity, node, message) {
  return { rule, severity, message, path: node.path, inShadow: node.inShadow };
}

/**
 * @param {Array} nodes descriptors from the browser collector
 * @returns {Array} findings
 */
export function checkXss(nodes) {
  const findings = [];

  for (const node of nodes) {
    // inline event handlers (onclick=, onerror=, ...) — CSP-hostile, classic injection sink
    for (const attr of Object.keys(node.attrs)) {
      if (attr.startsWith('on')) {
        findings.push(finding('inline-event-handler', 'warn', node,
          `inline ${attr}= handler — blocks a strict CSP and is a classic injection sink`));
      }
    }

    // javascript: URLs
    const href = node.attrs.href;
    if (href && /^\s*javascript:/i.test(href)) {
      findings.push(finding('javascript-url', 'error', node, 'javascript: URL in href'));
    }
  }

  return findings;
}
