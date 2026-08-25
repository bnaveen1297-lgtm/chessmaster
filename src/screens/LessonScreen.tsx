import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Chess } from 'chess.js';
import { Screen, Card, Button } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { ChessBoard } from '../components/ChessBoard';
import { colors, radius, spacing, typography } from '../theme';
import { legalTargets, isOwnPiece, checkedKingSquare } from '../game/chessHelpers';
import { lessonContent, type LessonExercise } from '../data/lessons';
import { nextLessonId } from '../data/content';
import { useProgress } from '../game/ProgressContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

export function LessonScreen({ route, navigation }: Props) {
  const lesson = lessonContent[route.params.id];
  const { progress, markLessonComplete } = useProgress();
  const completed = (progress.lessonsCompleted ?? []).includes(route.params.id);

  // Text-only lessons complete on button press; exercise lessons complete on solve.
  const complete = useCallback(() => markLessonComplete(route.params.id), [markLessonComplete, route.params.id]);
  const next = nextLessonId(route.params.id);

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
      {completed && (
        <View style={styles.doneChip}>
          <Icon name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.doneChipText}>Completed</Text>
        </View>
      )}
      <View style={{ height: spacing.xs }} />
      {lesson.sections.map((s, i) => (
        <Card key={i}>
          {s.heading && <Text style={styles.heading}>{s.heading}</Text>}
          <Text style={styles.body}>{s.text}</Text>
        </Card>
      ))}

      {lesson.exercise ? (
        <Exercise exercise={lesson.exercise} onSolved={complete} />
      ) : (
        !completed && (
          <View style={{ marginTop: spacing.sm }}>
            <Button label="Mark as complete  (+15 XP)" onPress={complete} />
          </View>
        )
      )}

      {(completed || !lesson.exercise) && next && (
        <View style={{ marginTop: spacing.md }}>
          <Button
            label="Next lesson ›"
            variant={completed ? 'primary' : 'outline'}
            onPress={() => navigation.replace('Lesson', { id: next })}
          />
        </View>
      )}

      <Text style={styles.footer}>Part of the ChessMaster self-learn curriculum.</Text>
    </Screen>
  );
}

function Exercise({ exercise, onSolved }: { exercise: LessonExercise; onSolved: () => void }) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 340);
  const gameRef = useRef<Chess | null>(null);
  if (gameRef.current === null) {
    const g = new Chess();
    try {
      g.load(exercise.fen);
    } catch {
      /* ignore */
    }
    gameRef.current = g;
  }

  const [fen, setFen] = useState(exercise.fen);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'solved'>('idle');
  const [showHint, setShowHint] = useState(false);
  const solvedRef = useRef(false);

  useEffect(() => {
    if (status === 'solved' && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
  }, [status, onSolved]);

  const reset = useCallback(() => {
    const g = new Chess();
    try {
      g.load(exercise.fen);
    } catch {
      /* ignore */
    }
    gameRef.current = g;
    setFen(g.fen());
    setSelected(null);
    setHighlights([]);
    setStatus('idle');
  }, [exercise.fen]);

  const onSquarePress = useCallback(
    (square: string) => {
      if (status === 'solved') return;
      const g = gameRef.current;
      if (!g) return;
      if (selected) {
        if (selected === exercise.from && square === exercise.to) {
          // correct move
          try {
            g.move({ from: selected, to: square, promotion: 'q' });
          } catch {
            /* ignore */
          }
          setFen(g.fen());
          setSelected(null);
          setHighlights([]);
          setStatus('solved');
          return;
        }
        // any other legal move counts as a wrong attempt
        if (legalTargets(g, selected).includes(square)) {
          setSelected(null);
          setHighlights([]);
          setStatus('wrong');
          return;
        }
      }
      if (isOwnPiece(g, square)) {
        setSelected(square);
        setHighlights(legalTargets(g, square));
        if (status === 'wrong') setStatus('idle');
      } else {
        setSelected(null);
        setHighlights([]);
      }
    },
    [selected, status, exercise.from, exercise.to],
  );

  return (
    <Card style={styles.exerciseCard}>
      <View style={styles.exerciseHead}>
        <Icon name="school" size={18} color={colors.tint} />
        <Text style={styles.exerciseTitle}>Your move</Text>
      </View>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <View style={styles.boardWrap}>
        <ChessBoard
          fen={fen}
          size={boardSize}
          onSquarePress={onSquarePress}
          selected={selected}
          highlights={highlights}
          checkSquare={gameRef.current ? checkedKingSquare(gameRef.current) : null}
          showCoords
        />
      </View>

      {status === 'solved' ? (
        <View style={[styles.feedback, styles.solved]}>
          <Icon name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.feedbackText}>{exercise.explain}</Text>
        </View>
      ) : status === 'wrong' ? (
        <View style={[styles.feedback, styles.wrong]}>
          <Icon name="close-circle" size={20} color={colors.danger} />
          <Text style={styles.feedbackText}>Not the strongest move — try again.</Text>
        </View>
      ) : (
        <Text style={styles.tapHint}>Tap a piece, then its destination.</Text>
      )}

      {status !== 'solved' && (
        <View style={styles.exerciseActions}>
          <View style={{ flex: 1 }}>
            <Button label={showHint ? exercise.hint : 'Show hint'} variant="outline" small onPress={() => setShowHint(true)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Reset" variant="light" small onPress={reset} />
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.muted, marginLeft: spacing.xs },
  heading: { ...typography.h3, color: colors.ink, marginBottom: spacing.xs },
  body: { ...typography.body, lineHeight: 22, color: colors.text },
  footer: { ...typography.muted, textAlign: 'center', marginTop: spacing.md },
  doneChip: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginLeft: spacing.xs, marginTop: 2 },
  doneChipText: { ...typography.muted, color: colors.success, fontWeight: '700' },

  exerciseCard: { marginTop: spacing.sm },
  exerciseHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exerciseTitle: { ...typography.label, color: colors.tint },
  prompt: { ...typography.h3, marginTop: 4, marginBottom: spacing.sm },
  boardWrap: { alignItems: 'center' },
  tapHint: { ...typography.muted, textAlign: 'center', marginTop: spacing.sm },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md, padding: spacing.sm, borderRadius: radius.md },
  solved: { backgroundColor: 'rgba(46,158,107,0.10)' },
  wrong: { backgroundColor: 'rgba(211,82,75,0.10)' },
  feedbackText: { ...typography.body, fontSize: 14, flex: 1, lineHeight: 20 },
  exerciseActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});
