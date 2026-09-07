import { createElement, memo } from 'react';
import { PIECES, type PieceNode } from '@shared/components/pieces/cburnett';

// Convert kebab-case SVG attributes (fill-rule, stroke-linecap…) to the
// camelCase React expects, so the shared cburnett node tree renders in the DOM.
function camel(attrs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k in attrs) out[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = attrs[k];
  return out;
}

let uid = 0;
function render(node: PieceNode): any {
  return createElement(node.tag, { key: uid++, ...camel(node.attrs) }, node.children.map(render));
}

/** A single chess piece — code is 'K','Q'… (white) or 'k','q'… (black). */
export const Piece = memo(function Piece({ code }: { code: string }) {
  const nodes = PIECES[code];
  if (!nodes) return null;
  return (
    <svg viewBox="0 0 45 45" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      {nodes.map(render)}
    </svg>
  );
});
