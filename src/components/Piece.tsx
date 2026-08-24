import React from 'react';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { PIECES, type PieceNode } from './pieces/cburnett';

const COMPONENTS: Record<string, React.ComponentType<any>> = { g: G, path: Path, circle: Circle };

const ATTR_MAP: Record<string, string> = {
  'fill-rule': 'fillRule',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'fill-opacity': 'fillOpacity',
  'stroke-opacity': 'strokeOpacity',
};

function mapAttrs(attrs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) out[ATTR_MAP[k] ?? k] = v;
  return out;
}

function renderNode(node: PieceNode, key: number): React.ReactNode {
  const Comp = COMPONENTS[node.tag];
  if (!Comp) return null;
  return (
    <Comp key={key} {...mapAttrs(node.attrs)}>
      {node.children.map((c, i) => renderNode(c, i))}
    </Comp>
  );
}

/**
 * A chess piece from the bundled Cburnett set.
 * `piece` is a chess.js code: uppercase = white, lowercase = black.
 */
export function Piece({ piece, size }: { piece: string; size: number }) {
  const nodes = PIECES[piece];
  if (!nodes) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 45 45">
      {nodes.map((n, i) => renderNode(n, i))}
    </Svg>
  );
}
