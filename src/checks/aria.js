// Pure ARIA checks over node descriptors — no browser needed, so they unit-test cleanly.
const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'menuitem', 'tab', 'switch',
  'textbox', 'combobox', 'slider', 'option', 'radio',
]);

const FOCUSABLE_TAGS = new Set(['button', 'input', 'select', 'textarea', 'summary']);

// WAI-ARIA 1.2 role names (abridged but broad).
const VALID_ROLES = new Set([
  'alert', 'alertdialog', 'application', 'article', 'banner', 'blockquote', 'button', 'caption',
  'cell', 'checkbox', 'code', 'columnheader', 'combobox', 'complementary', 'contentinfo',
  'definition', 'deletion', 'dialog', 'directory', 'document', 'emphasis', 'feed', 'figure',
  'form', 'generic', 'grid', 'gridcell', 'group', 'heading', 'img', 'insertion', 'link', 'list',
  'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'meter', 'navigation', 'none', 'note', 'option',
  'paragraph', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
  'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton', 'status',
  'strong', 'subscript', 'superscript', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term',
  'textbox', 'time', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem',
]);

function hasAccessibleName(node) {
  const n = node.name || {};
  return Boolean(n.ariaLabel || n.ariaLabelledby || n.title || n.alt || (n.text && n.text.length));
}

function isFocusable(node) {
  const raw = node.attrs.tabindex;
  const ti = raw === undefined ? null : Number(raw);
  if (ti !== null && ti < 0) return false;          // explicitly removed from tab order
  if (ti !== null && ti >= 0) return true;
  if (FOCUSABLE_TAGS.has(node.tag)) return true;
  if (node.tag === 'a' && node.attrs.href) return true;
  if (node.role && INTERACTIVE_ROLES.has(node.role)) return true;
  return false;
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
  const seenLightIds = new Set();

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

    // 4. aria-hidden on a focusable element — hidden from AT but still keyboard-reachable
    if (node.attrs['aria-hidden'] === 'true' && isFocusable(node)) {
      findings.push(finding('aria-hidden-focusable', 'error', node,
        `aria-hidden="true" on a focusable <${node.tag}> — invisible to assistive tech but still reachable by keyboard`));
    }

    // 5. invalid ARIA role token
    if (node.role && !VALID_ROLES.has(node.role)) {
      findings.push(finding('role-invalid', 'error', node,
        `role="${node.role}" is not a valid ARIA role`));
    }

    // 6. role="img" with no accessible name — a screen reader announces nothing
    if (node.role === 'img' && !hasAccessibleName(node)) {
      findings.push(finding('img-role-no-name', 'error', node,
        `role="img" has no accessible name (aria-label / alt) — announced as nothing`));
    }

    // 7. duplicate id in the light DOM (shadow roots are encapsulated, so those are fine)
    if (node.id && !node.inShadow) {
      if (seenLightIds.has(node.id)) {
        findings.push(finding('duplicate-id', 'warn', node,
          `duplicate id "${node.id}" in the light DOM — breaks idref targeting`));
      } else {
        seenLightIds.add(node.id);
      }
    }
  }

  return findings;
}
