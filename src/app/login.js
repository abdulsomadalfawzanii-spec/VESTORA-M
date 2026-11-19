import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import BrandHeader from '../components/BrandHeader.js';
import Field from '../components/Field.js';
import PrimaryButton from '../components/PrimaryButton.js';
import Screen from '../components/Screen.js';
import { theme } from '../lib/theme.js';
import { useAuth } from '../providers/AuthProvider.js';

export default function LoginScreen() {
  const { login, ready, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (ready && user) return <Redirect href="/catalog" />;

  async function submit() {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/catalog');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BrandHeader title="Welcome back" />
        <Text style={styles.eyebrow}>YOUR POINT OF VIEW</Text>
        <Text style={styles.heading}>Sign in to find your next favourite.</Text>
        <Text style={styles.description}>
          Discover considered pieces from independent fashion businesses.
        </Text>

        <View style={styles.form}>
          <Field
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
          <Field
            autoCapitalize="none"
            autoComplete="password"
            label="Password"
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            value={password}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <PrimaryButton loading={loading} onPress={submit} title="Sign in" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to VESTORA?</Text>
          <Link href="/register" style={styles.link}>Create an account</Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 36,
  },
  eyebrow: {
    marginTop: 26,
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heading: {
    marginTop: 10,
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 36,
    lineHeight: 43,
  },
  description: {
    marginTop: 12,
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  form: {
    gap: 16,
    marginTop: 28,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 24,
  },
  footerText: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  link: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
});
