import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { colors, spacing, typography } from '../theme';
import { lessonContent } from '../data/lessons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

export function LessonScreen({ route }: Props) {
  const lesson = lessonContent[route.params.id];

  if (!lesson) {
    return (
      <Screen>
        <AppHeader eyebrow="LESSON" title="Coming soon" />
        <Text style={styles.intro}>This lesson is being written.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader eyebrow="SELF-LEARN LESSON" title={lesson.title} />
      <View style={{ height: spacing.xs }} />
      {lesson.sections.map((s, i) => (
        <Card key={i}>
          {s.heading && <Text style={styles.heading}>{s.heading}</Text>}
          <Text style={styles.body}>{s.text}</Text>
        </Card>
      ))}
      <Text style={styles.footer}>Part of the ChessMaster self-learn curriculum.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.muted, marginLeft: spacing.xs },
  heading: { ...typography.h3, color: colors.ink, marginBottom: spacing.xs },
  body: { ...typography.body, lineHeight: 22, color: colors.text },
  footer: { ...typography.muted, textAlign: 'center', marginTop: spacing.md },
});
