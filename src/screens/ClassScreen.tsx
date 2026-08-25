import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Segmented, Group, Row, Button, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon, type IconName } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { classLevels, languageSchedules, curriculum, liveGames, orderedLessonIds, firstIncompleteLesson } from '../data/content';
import { useProgress } from '../game/ProgressContext';
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
  const { progress } = useProgress();
  const completed = progress.lessonsCompleted ?? [];
  const isDone = (id: string) => completed.includes(id);
  const resume = firstIncompleteLesson(completed);
  const totalDone = orderedLessonIds.filter((id) => completed.includes(id)).length;

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
          {resume && (
            <Card style={styles.resume} onPress={() => navigation.navigate('Lesson', { id: resume.id })}>
              <View style={styles.resumeRow}>
                <View style={styles.resumeGlyph}><Icon name="play" size={20} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resumeLabel}>{totalDone > 0 ? 'CONTINUE LEARNING' : 'START LEARNING'}</Text>
                  <Text style={styles.resumeTitle}>{resume.title}</Text>
                  <Text style={styles.resumeMeta}>{totalDone}/{orderedLessonIds.length} lessons complete</Text>
                </View>
                <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </View>
            </Card>
          )}
          {!resume && (
            <Card style={styles.resume}>
              <View style={styles.resumeRow}>
                <View style={styles.resumeGlyph}><Icon name="school" size={20} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resumeLabel}>CURRICULUM COMPLETE</Text>
                  <Text style={styles.resumeTitle}>All {orderedLessonIds.length} lessons done</Text>
                </View>
              </View>
            </Card>
          )}

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
            const done = unit.lessons.filter((l) => isDone(l.id)).length;
            return (
              <View key={unit.id}>
                <View style={styles.unitHeader}>
                  <Text style={styles.unitTitle}>{unit.title}</Text>
                  <Text style={styles.unitCount}>{done}/{unit.lessons.length} DONE</Text>
                </View>
                <Group>
                  {unit.lessons.map((lesson, i) => {
                    const done2 = isDone(lesson.id);
                    return (
                      <Row
                        key={lesson.id}
                        first={i === 0}
                        last={i === unit.lessons.length - 1}
                        title={lesson.title}
                        subtitle={done2 ? 'Completed' : `${lesson.minutes} min`}
                        onPress={() => navigation.navigate('Lesson', { id: lesson.id })}
                        left={
                          <View style={[styles.dot, done2 && styles.dotDone]}>
                            {done2 && <Icon name="checkmark" size={13} color={colors.onDark} />}
                          </View>
                        }
                        right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
                      />
                    );
                  })}
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

  resume: { backgroundColor: colors.tint, marginTop: spacing.xs },
  resumeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resumeGlyph: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  resumeLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '800', fontSize: 11, letterSpacing: 0.6 },
  resumeTitle: { ...typography.h3, color: colors.onDark, marginTop: 1 },
  resumeMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, marginTop: 1 },

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
