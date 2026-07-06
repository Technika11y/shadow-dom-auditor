// Pure ARIA checks over node descriptors — no browser needed, so they unit-test cleanly.
const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'menuitem', 'tab', 'switch',
  'textbox', 'combobox', 'slider', 'option', 'radio',
]);

function hasAccessibleName(node) {
  const n = node.name || {};
  return Boolean(n.ariaLabel || n.ariaLabelledby || n.title || n.alt || (n.text && n.text.length));
}

function finding(rule, severity, node, message) {
  return { rule, severity, message, path: node.path, inShadow: node.inShadow };
}

/**
 * @param {Array} nodes  descriptors from the browser collector
 * @param {Set<string>} [allIds]  every id present on the page (light + shadow)
 * @returns {Array} findings
 */
export function checkAria(nodes, allIds) {
  const ids = allIds || new Set(nodes.map((n) => n.id).filter(Boolean));
  const findings = [];

  for (const node of nodes) {
    // 1. interactive role with no accessible name
    if (node.role && INTERACTIVE_ROLES.has(node.role) && !hasAccessibleName(node)) {
      findings.push(finding('aria-name-missing', 'error', node,
        `<${node.tag} role="${node.role}"> has no accessible name`));
    }

    // 2. aria-labelledby / aria-describedby referencing a missing id.
    //    Inside a shadow root this is the classic silent break: idrefs never cross the boundary.
    for (const ref of ['aria-labelledby', 'aria-describedby']) {
      const val = node.attrs[ref];
      if (!val) continue;
      for (const token of val.split(/\s+/)) {
        if (token && !ids.has(token)) {
          const scope = node.inShadow
            ? ' (shadow-DOM scope — cross-root idrefs never resolve)'
            : '';
          findings.push(finding('aria-idref-broken', 'error', node,
            `${ref}="${token}" points to an id that does not exist${scope}`));
        }
      }
    }

    // 3. positive tabindex — focus-order smell
    const ti = node.attrs.tabindex;
    if (ti && Number(ti) > 0) {
      findings.push(finding('tabindex-positive', 'warn', node,
        `tabindex="${ti}" overrides natural focus order`));
    }
  }

  return findings;
}
