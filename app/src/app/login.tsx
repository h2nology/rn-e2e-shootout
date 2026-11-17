// A1：登录表单
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { Button, colors, Label, Screen } from '@/components/ui';
import { t } from '@/lib/i18n';
import { auth } from '@/lib/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setEmailError('Invalid email');
      return;
    }
    setEmailError(null);
    setBusy(true);
    try {
      await auth.login(email, password);
      router.replace('/');
    } catch {
      setError('Invalid credentials');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Label>Email</Label>
      <TextInput
        testID="login-email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      {emailError && (
        <Label testID="login-email-error" style={styles.error}>
          {emailError}
        </Label>
      )}
      <Label>Password</Label>
      <TextInput
        testID="login-password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && (
        <Label testID="login-error" style={styles.error}>
          {error}
        </Label>
      )}
      <Button testID="login-submit" title={t('signIn')} onPress={submit} disabled={busy} />
      {busy && <ActivityIndicator testID="login-loading" />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 16 },
  error: { color: colors.danger },
});
