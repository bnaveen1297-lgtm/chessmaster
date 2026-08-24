import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export type IconName = keyof typeof Ionicons.glyphMap;

/** Crisp vector icon (Ionicons — iOS style). Used app-wide instead of emoji. */
export function Icon({ name, size = 20, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}
