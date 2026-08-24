import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Screen, Card, Segmented, Button, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { colors, radius, spacing, typography } from '../theme';
import { classLevels, languageSchedules, curriculum, liveGames } from '../data/content';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Class'>,
  NativeStackScreenProps<RootStackParamList>
>;

const TABS = ['Live Class', 'Upcoming Class', 'All Class'];

export function ClassScreen({ navigation }: Props) {
  const [tab, setTab] = useState(TABS[0]);
  const live = liveGames.find((g) => g.status === 'live')!;

  return (
    <Screen>
      <AppHeader title="Class" onProfile={() => navigation.navigate('Profile')} />
      <Segmented options={TABS} value={tab} onChange={setTab} />

      {tab === 'Live Class' && (
        <View>
          {/* Olympiad live highlight (ChessMaster feature) */}
          <Card style={styles.olympiad} onPress={() => navigation.navigate('LiveGame', { id: live.id })}>
            <Pill label="OLYMPIAD LIVE" tone="live" />
            <Text style={styles.olympiadTitle}>
              {live.white} vs {live.black}
            </Text>
            <Text style={styles.olympiadMeta}>{live.event} · move {live.moves}</Text>
            <View style={styles.playBadge}><Text style={styles.playGlyph}>▶</Text></View>
          </Card>

          <Text style={typography.h3}>Live coaching now</Text>
          <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
            Join a class in your language. Miss one? Watch the recording anytime.
          </Text>
          <View style={styles.langRow}>
            {['தமிழ்', 'Hindi', 'English', 'Russian'].map((l) => (
              <Card key={l} style={styles.langChip}>
                <View style={styles.playBadgeSm}><Text style={styles.playGlyphSm}>▶</Text></View>
                <Text style={styles.langText}>{l}</Text>
              </Card>
            ))}
          </View>
        </View>
      )}

      {tab === 'Upcoming Class' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
          {languageSchedules.map((s) => (
            <View key={s.id} style={[styles.schedule, { backgroundColor: s.color }]}>
              <Text style={styles.scheduleTitle}>{s.language}</Text>
              {s.days.map((d) => (
                <View key={d.day} style={styles.scheduleRow}>
                  <Text style={styles.scheduleDay}>{d.day}</Text>
                  <Text style={styles.scheduleTime}>{d.time}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {tab === 'All Class' && (
        <View>
          {classLevels.map((lvl) => (
            <View key={lvl.id} style={[styles.level, { backgroundColor: lvl.color }]}>
              <Text style={styles.levelTitle}>{lvl.level}</Text>
              <Text style={styles.levelBlurb}>{lvl.blurb}</Text>
              <View style={styles.startBtn}>
                <Button label="Start" variant="light" small />
              </View>
            </View>
          ))}

          <Text style={[typography.h3, { marginTop: spacing.lg }]}>Self-learn curriculum</Text>
          <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
            An end-to-end path from your first move to advanced endgames.
          </Text>
          {curriculum.map((unit) => {
            const done = unit.lessons.filter((l) => l.done).length;
            return (
              <Card key={unit.id}>
                <View style={styles.rowBetween}>
                  <Text style={typography.h3}>{unit.title}</Text>
                  <Text style={typography.label}>{done}/{unit.lessons.length} DONE</Text>
                </View>
                {unit.lessons.map((lesson) => (
                  <View key={lesson.id} style={styles.lessonRow}>
                    <View style={[styles.dot, lesson.done && { backgroundColor: colors.success, borderColor: colors.success }]}>
                      {lesson.done && <Text style={styles.check}>✓</Text>}
                    </View>
                    <Text style={[styles.lessonTitle, lesson.done && styles.lessonDone]}>{lesson.title}</Text>
                    <Text style={typography.label}>{lesson.minutes}m</Text>
                  </View>
                ))}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  olympiad: { backgroundColor: colors.dark, borderColor: colors.dark },
  olympiadTitle: { ...typography.h2, color: colors.onDark, marginTop: spacing.sm },
  olympiadMeta: { ...typography.muted, color: '#B9B9C0' },
  playBadge: {
    position: 'absolute', right: spacing.md, top: '50%',
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  playGlyph: { color: colors.ink, fontSize: 16 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  langChip: { width: '47%', alignItems: 'center', paddingVertical: spacing.lg, marginBottom: 0 },
  playBadgeSm: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  playGlyphSm: { fontSize: 13, color: colors.ink },
  langText: { ...typography.h3 },
  schedule: { width: 230, borderRadius: radius.lg, padding: spacing.md },
  scheduleTitle: { ...typography.h2, color: colors.onDark, marginBottom: spacing.sm },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.25)' },
  scheduleDay: { color: colors.onDark, fontSize: 13, fontWeight: '600' },
  scheduleTime: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  level: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  levelTitle: { ...typography.h2, color: colors.onDark },
  levelBlurb: { ...typography.muted, color: 'rgba(255,255,255,0.9)', marginVertical: spacing.xs },
  startBtn: { alignSelf: 'flex-start', marginTop: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  check: { color: colors.onDark, fontSize: 11, fontWeight: '900' },
  lessonTitle: { ...typography.body, flex: 1 },
  lessonDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
});
