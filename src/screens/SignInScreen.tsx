import React, { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen, Button, Input } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen>
      <Text style={typography.h1}>Your way to become a King</Text>
      <View style={{ height: spacing.lg }} />

      <Input placeholder="Email address" value={email} onChangeText={setEmail} />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Text style={styles.forgot}>Forgotten your password?</Text>

      <Text style={styles.terms}>
        By logging in you agree to ChessMaster's Privacy Policy and Terms of Use.
      </Text>

      <Button label="Sign In" onPress={() => signIn(email, password)} />
      <Text style={styles.switch} onPress={() => navigation.navigate('SignUp')}>
        Not a member? <Text style={styles.link}>Join Us</Text>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  forgot: { ...typography.muted, textAlign: 'right', color: colors.gold, fontWeight: '600' },
  terms: { ...typography.muted, fontSize: 12, marginVertical: spacing.md },
  switch: { ...typography.muted, textAlign: 'center', marginTop: spacing.md },
  link: { color: colors.ink, fontWeight: '700' },
});
