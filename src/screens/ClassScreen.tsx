import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Segmented, Group, Row, Button, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon, type IconName } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
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

const LEVEL_ICON: Record<string, IconName> = { beg: 'leaf', int: 'trending-up', exp: 'ribbon' };
const LANGS = ['தமிழ்', 'Hindi', 'English', 'Russian'];

export function ClassScreen({ navigation }: Props) {
  const [tab, setTab] = useState(TABS[0]);
  const live = liveGames.find((g) => g.status === 'live')!;

  return (
    <Screen>
      <AppHeader eyebrow="LEARN" title="Class" onProfile={() => navigation.navigate('Profile')} />
      <Segmented options={TABS} value={tab} onChange={setTab} />

      {tab === 'Live Class' && (
        <View>
          {/* Dark hero: featured broadcast (Apple Fitness-style single dark card) */}
          <Card style={styles.hero} onPress={() => navigation.navigate('LiveGame', { id: live.id })}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Pill label="FEATURED GAME" tone="gold" />
                <Text style={styles.heroTitle}>
                  {live.white} vs {live.black}
                </Text>
                <Text style={styles.heroMeta}>{live.event}</Text>
              </View>
              <View style={styles.playBadge}>
                <Icon name="play" size={20} color={colors.onDark} />
              </View>
            </View>
          </Card>

          <Text style={styles.label}>LIVE COACHING</Text>
          <Text style={styles.sub}>Join a class in your language, or watch the recording anytime.</Text>
          <Group>
            {LANGS.map((l, i) => (
              <Row
                key={l}
                first={i === 0}
                last={i === LANGS.length - 1}
                title={l}
                subtitle="Live coaching now"
                left={
                  <View style={[styles.iconSquare, { backgroundColor: colors.tint }]}>
                    <Icon name="play" size={18} color="#fff" />
                  </View>
                }
                right={
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                }
              />
            ))}
          </Group>
        </View>
      )}

      {tab === 'Upcoming Class' && (
        <View>
          {languageSchedules.map((s) => (
            <View key={s.id}>
              <View style={styles.langHeader}>
                <View style={[styles.langDot, { backgroundColor: s.color }]} />
                <Text style={styles.langLabel}>{s.language.toUpperCase()}</Text>
              </View>
              <Group>
                {s.days.map((d, i) => (
                  <Row
                    key={d.day}
                    first={i === 0}
                    last={i === s.days.length - 1}
                    title={d.day}
                    right={<Text style={styles.timeText}>{d.time}</Text>}
                  />
                ))}
              </Group>
            </View>
          ))}
        </View>
      )}

      {tab === 'All Class' && (
        <View>
          <Text style={styles.label}>CHOOSE YOUR LEVEL</Text>
          <Group>
            {classLevels.map((lvl, i) => (
              <Row
                key={lvl.id}
                first={i === 0}
                last={i === classLevels.length - 1}
                title={lvl.level}
                subtitle={lvl.blurb}
                left={
                  <View style={[styles.iconSquare, { backgroundColor: lvl.color }]}>
                    <Icon name={LEVEL_ICON[lvl.id] ?? 'school'} size={18} color="#fff" />
                  </View>
                }
                right={<Button label="Start" variant="outline" small />}
              />
            ))}
          </Group>

          <Text style={styles.label}>REFERENCE</Text>
          <Group>
            <Row
              first
              last
              title="Opening Book"
              subtitle="Named openings, lines and ideas (ECO)."
              onPress={() => navigation.navigate('Openings')}
              left={
                <View style={[styles.iconSquare, { backgroundColor: colors.tint }]}>
                  <Icon name="library" size={18} color="#fff" />
                </View>
              }
              right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
            />
          </Group>

          <Text style={styles.label}>SELF-LEARN CURRICULUM</Text>
          <Text style={styles.sub}>An end-to-end path from your first move to advanced endgames.</Text>
          {curriculum.map((unit) => {
            const done = unit.lessons.filter((l) => l.done).length;
            return (
              <View key={unit.id}>
                <View style={styles.unitHeader}>
                  <Text style={styles.unitTitle}>{unit.title}</Text>
                  <Text style={styles.unitCount}>{done}/{unit.lessons.length} DONE</Text>
                </View>
                <Group>
                  {unit.lessons.map((lesson, i) => (
                    <Row
                      key={lesson.id}
                      first={i === 0}
                      last={i === unit.lessons.length - 1}
                      title={lesson.title}
                      subtitle={`${lesson.minutes} min`}
                      onPress={() => navigation.navigate('Lesson', { id: lesson.id })}
                      left={
                        <View style={[styles.dot, lesson.done && styles.dotDone]}>
                          {lesson.done && <Icon name="checkmark" size={13} color={colors.onDark} />}
                        </View>
                      }
                      right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
                    />
                  ))}
                </Group>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  sub: { ...typography.muted, marginLeft: spacing.xs, marginTop: -4, marginBottom: spacing.sm },

  hero: { backgroundColor: colors.ink, marginTop: spacing.xs },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroTitle: { ...typography.h2, color: colors.onDark, marginTop: spacing.sm },
  heroMeta: { ...typography.muted, color: '#B9B9C0', marginTop: 2 },
  playBadge: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tint,
    alignItems: 'center', justifyContent: 'center',
  },

  iconSquare: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  liveText: { color: colors.danger, fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },

  langHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  langLabel: { ...typography.label, color: colors.textMuted },
  langDot: { width: 10, height: 10, borderRadius: 5 },
  timeText: { ...typography.muted, fontSize: 13 },

  unitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  unitTitle: { ...typography.h3, color: colors.ink },
  unitCount: { ...typography.label, color: colors.textMuted },

  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.success, borderColor: colors.success },
});
