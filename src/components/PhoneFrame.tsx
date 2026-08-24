import React from 'react';
import { View, Text, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../theme';

/**
 * On the web, when the viewport is wide (desktop/tablet), render the app inside
 * a centered phone-shaped frame so it reads as a mobile app rather than a
 * stretched web page. On real phones (or narrow browsers) and on native, it
 * renders full-bleed and this wrapper is a no-op.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();

  const framed = Platform.OS === 'web' && width >= 560;
  if (!framed) return <>{children}</>;

  const frameH = Math.min(880, Math.max(640, height - 48));
  const frameW = Math.round(frameH * 0.472); // ~ iPhone aspect

  return (
    <View style={[styles.page, { minHeight: height }]}>
      <View style={styles.brandCol}>
        <Text style={styles.brand}>♞ ChessMaster</Text>
        <Text style={styles.brandSub}>Mobile app preview</Text>
      </View>
      <View style={[styles.phone, { width: frameW, height: frameH }]}>
        <View style={styles.notch} />
        <View style={styles.screen}>{children}</View>
      </View>
      <Text style={styles.hint}>Open on your phone for the full-screen app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#17130E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brandCol: { position: 'absolute', top: 28, alignItems: 'center' },
  brand: { color: '#F5EFE3', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  brandSub: { color: '#B58A32', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
  phone: {
    backgroundColor: '#0E0E10',
    borderRadius: 44,
    padding: 10,
    // shadow (mapped to boxShadow on web)
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
  },
  notch: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 120,
    height: 24,
    backgroundColor: '#0E0E10',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 10,
  },
  screen: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  hint: { position: 'absolute', bottom: 24, color: '#6E685C', fontSize: 12 },
});
