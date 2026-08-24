import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
} from 'react-native-svg';

type Props = {
  size?: number;
  /** Show the rounded app-tile background. Off = knight mark only. */
  tile?: boolean;
};

/**
 * ChessMaster brand mark — golden knight on a royal-purple tile.
 * Mirrors /assets/logo.svg so the icon and in-app mark stay in sync.
 */
export function Logo({ size = 96, tile = true }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="cm-bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#4C1D95" />
          <Stop offset="0.55" stopColor="#6D28D9" />
          <Stop offset="1" stopColor="#7C3AED" />
        </LinearGradient>
        <LinearGradient id="cm-gold" x1="150" y1="120" x2="380" y2="430" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FDE68A" />
          <Stop offset="0.5" stopColor="#F5C542" />
          <Stop offset="1" stopColor="#D9A100" />
        </LinearGradient>
      </Defs>

      {tile && <Rect x="0" y="0" width="512" height="512" rx="112" fill="url(#cm-bg)" />}

      {tile && (
        <G opacity={0.1} fill="#FFFFFF">
          <Rect x="40" y="40" width="36" height="36" />
          <Rect x="112" y="40" width="36" height="36" />
          <Rect x="76" y="76" width="36" height="36" />
          <Rect x="40" y="112" width="36" height="36" />
        </G>
      )}

      <G>
        <Path
          fill="url(#cm-gold)"
          d="M196 132c-8 14-10 27-8 40-22 16-46 44-54 92-3 18 2 30 14 34 10 3 19-2 25-12 6-10 13-19 24-24-6 16-8 30-8 44 0 8-3 15-9 22-8 9-13 18-13 28h176c0-40-10-70-30-104-16-27-22-49-22-74 0-30-14-54-42-70-13-8-27-12-40-10-4-4-8-8-13-11-2-1-4 1-3 3 3 6 5 12 6 18-10-2-20-2-30 4z"
        />
        <Circle cx="214" cy="176" r="9" fill="#4C1D95" />
      </G>

      <Rect x="150" y="392" width="212" height="26" rx="13" fill="url(#cm-gold)" />
      <Rect x="132" y="424" width="248" height="28" rx="14" fill="url(#cm-gold)" />
    </Svg>
  );
}
