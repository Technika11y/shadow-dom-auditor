// Runs INSIDE the page via page.evaluate(). Must be fully self-contained —
// no imports, no closures over Node scope. It walks the light DOM and recurses
// into every open shadow root, emitting a serializable descriptor per element.
export function collectNodes() {
  const results = [];

  function relevantAttrs(el) {
    const out = {};
    for (const a of el.attributes) {
      if (
        a.name === 'role' ||
        a.name === 'id' ||
        a.name === 'href' ||
        a.name === 'tabindex' ||
        a.name.startsWith('aria-') ||
        a.name.startsWith('on')
      ) {
        out[a.name] = a.value;
      }
    }
    return out;
  }

  function nameSources(el) {
    return {
      ariaLabel: el.getAttribute('aria-label') || null,
      ariaLabelledby: el.getAttribute('aria-labelledby') || null,
      title: el.getAttribute('title') || null,
      alt: el.getAttribute('alt') || null,
      text: (el.textContent || '').trim().slice(0, 80) || null,
    };
  }

  // Build a readable path, hopping across shadow boundaries via the host element.
  function pathOf(el) {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 12) {
      let seg = node.tagName.toLowerCase();
      if (node.id) seg += '#' + node.id;
      parts.unshift(seg);
      const root = node.getRootNode && node.getRootNode();
      node = root && root.host ? root.host : node.parentElement;
    }
    return parts.join(' > ');
  }

  function visit(root, inShadow) {
    for (const el of root.querySelectorAll('*')) {
      results.push({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || null,
        id: el.id || null,
        attrs: relevantAttrs(el),
        name: nameSources(el),
        path: pathOf(el),
        inShadow,
      });
      if (el.shadowRoot) visit(el.shadowRoot, true); // open roots only — closed are unreachable
    }
  }

  visit(document, false);
  return results;
}
