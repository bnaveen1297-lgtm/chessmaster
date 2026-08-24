import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Screen, Button, Input } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUp, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <Screen>
      <Text style={typography.h1}>Become a Chess Member</Text>
      <Text style={[typography.muted, { marginBottom: spacing.lg }]}>
        Create your ChessMaster profile and get first access to the very best
        classes, tools and community.
      </Text>

      <Input placeholder="Email address" value={email} onChangeText={setEmail} />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Input placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <Input placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      <Input placeholder="Date of Birth" />
      <Text style={styles.perk}>Get a surprise every year on your Birthday</Text>
      <Input placeholder="Country (India)" />

      {authError && <Text style={styles.error}>{authError}</Text>}

      <Text style={styles.terms}>
        By creating an account, you agree to ChessMaster's Privacy Policy and
        Terms of Use.
      </Text>

      <Button label="Join Us" onPress={() => signUp({ email, password, firstName, lastName })} />
      <Text style={styles.switch} onPress={() => navigation.navigate('SignIn')}>
        Already a member? <Text style={styles.link}>Sign in</Text>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  perk: { ...typography.muted, color: colors.gold, marginBottom: spacing.sm },
  error: { color: colors.danger, fontWeight: '600', marginBottom: spacing.sm },
  terms: { ...typography.muted, fontSize: 12, marginVertical: spacing.md },
  switch: { ...typography.muted, textAlign: 'center', marginTop: spacing.md },
  link: { color: colors.ink, fontWeight: '700' },
});
