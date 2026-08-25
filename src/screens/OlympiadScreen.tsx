import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Group, Row, Pill } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { OLYMPIAD, olympiadTeams, olympiadDates, daysUntilOlympiad, olympiadPhase } from '../data/olympiad';
import { masterGames } from '../data/masters';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Olympiad'>;

export function OlympiadScreen({ navigation }: Props) {
  const days = daysUntilOlympiad();
  const phase = olympiadPhase();
  const featured = masterGames.slice(0, 4);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹ Back</Text>

        {/* Hero — Samarkand turquoise */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroEyebrow}>SAMARKAND · UZBEKISTAN</Text>
            {phase === 'live' ? (
              <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.livePillText}>LIVE</Text></View>
            ) : null}
          </View>
          <Text style={styles.heroTitle}>{OLYMPIAD.edition}</Text>
          <Text style={styles.heroTagline}>{OLYMPIAD.tagline}</Text>

          {phase === 'upcoming' && (
            <View style={styles.countdown}>
              <Text style={styles.countNum}>{days}</Text>
              <View>
                <Text style={styles.countLabel}>DAYS TO GO</Text>
                <Text style={styles.countSub}>Opening ceremony {olympiadDates.split('–')[0]} Sep</Text>
              </View>
            </View>
          )}
          {phase === 'live' && <Text style={styles.countSub}>Round in progress · {olympiadDates}</Text>}
          {phase === 'finished' && <Text style={styles.countSub}>The 46th Olympiad has concluded.</Text>}
        </View>

        {/* Live boards — streams during the event, links to the broadcast screen */}
        <Card style={styles.liveCard} onPress={() => navigation.navigate('LiveBoards')}>
          <View style={styles.liveBadge}>
            <Icon name="radio" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.liveTitle}>Live boards</Text>
            <Text style={styles.liveSub}>Follow the games live during the event</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textFaint} />
        </Card>

        {/* Event facts */}
        <Group style={{ marginTop: spacing.md }}>
          <Row first title="Dates" left={<TileIcon name="calendar" />} right={<Text style={styles.val}>{olympiadDates}</Text>} />
          <Row title="Venue" left={<TileIcon name="business" />} right={<Text style={styles.val} numberOfLines={1}>Silk Road Center</Text>} />
          <Row title="Format" left={<TileIcon name="grid" />} right={<Text style={styles.val}>{OLYMPIAD.rounds}-round Swiss</Text>} />
          <Row last title="Sections" left={<TileIcon name="people" />} right={<Text style={styles.val}>{OLYMPIAD.sections}</Text>} />
        </Group>

        {/* Teams */}
        <Text style={styles.label}>TEAMS & STARS TO WATCH</Text>
        <Group>
          {olympiadTeams.map((t, i) => (
            <Row
              key={t.code}
              first={i === 0}
              last={i === olympiadTeams.length - 1}
              title={t.country}
              subtitle={t.stars.join(' · ')}
              left={<View style={styles.codeBadge}><Text style={styles.codeText}>{t.code}</Text></View>}
              right={
                t.host ? <Pill label="HOST" tone="gold" /> : t.defending ? <Pill label="CHAMPS" tone="success" /> : undefined
              }
            />
          ))}
        </Group>
        <Text style={styles.note}>Squads are confirmed close to the event — treat these as stars to watch, not official line-ups.</Text>

        {/* Featured boards */}
        <Text style={styles.label}>FEATURED BOARDS</Text>
        <Text style={styles.sub}>
          Watch or play through chess masterpieces. Live Olympiad boards stream from FIDE during the event.
        </Text>
        <Group>
          {featured.map((g, i) => (
            <Row
              key={g.id}
              first={i === 0}
              last={i === featured.length - 1}
              title={g.nickname || `${short(g.white)} vs ${short(g.black)}`}
              subtitle={`${short(g.white)} – ${short(g.black)} · ${g.year}`}
              left={<View style={styles.boardBadge}><Icon name="play" size={16} color="#fff" /></View>}
              right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
              onPress={() => navigation.navigate('MasterGame', { id: g.id })}
            />
          ))}
        </Group>
        <Card style={styles.allCard} onPress={() => navigation.navigate('MasterBase')}>
          <View style={styles.allRow}>
            <Icon name="library" size={20} color={colors.samarkand} />
            <Text style={styles.allText}>Open the full Master Base</Text>
            <Icon name="chevron-forward" size={18} color={colors.textFaint} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function TileIcon({ name }: { name: any }) {
  return (
    <View style={styles.tile}><Icon name={name} size={17} color="#fff" /></View>
  );
}

function short(name: string): string {
  const p = name.split(' ');
  return p[p.length - 1];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { ...typography.body, color: colors.samarkand, marginBottom: spacing.sm },
  hero: { backgroundColor: colors.samarkandDeep, borderRadius: radius.xl, padding: spacing.lg },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: { color: colors.samarkandTile, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.danger, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePillText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: spacing.sm, letterSpacing: -0.3 },
  heroTagline: { color: 'rgba(255,255,255,0.85)', marginTop: 2, fontSize: 14 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  countNum: { color: colors.gold, fontSize: 52, fontWeight: '900', letterSpacing: -1 },
  countLabel: { color: '#fff', fontWeight: '800', letterSpacing: 1, fontSize: 12 },
  countSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, marginTop: 2 },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  sub: { ...typography.muted, marginLeft: spacing.xs, marginTop: -4, marginBottom: spacing.sm },
  note: { ...typography.muted, fontSize: 11.5, marginLeft: spacing.xs, marginTop: spacing.sm },
  val: { ...typography.muted, color: colors.ink, fontWeight: '600' },
  tile: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.samarkand, alignItems: 'center', justifyContent: 'center' },
  codeBadge: { width: 40, height: 30, borderRadius: 8, backgroundColor: colors.samarkandDeep, alignItems: 'center', justifyContent: 'center' },
  codeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  boardBadge: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.samarkand, alignItems: 'center', justifyContent: 'center' },
  liveCard: { marginTop: spacing.md, marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.samarkand, alignItems: 'center', justifyContent: 'center' },
  liveTitle: { ...typography.h3 },
  liveSub: { ...typography.muted, marginTop: 1 },
  allCard: { marginTop: spacing.xs },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  allText: { ...typography.h3, flex: 1 },
});
