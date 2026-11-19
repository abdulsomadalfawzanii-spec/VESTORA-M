import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import BrandHeader from '../components/BrandHeader.js';
import Field from '../components/Field.js';
import PrimaryButton from '../components/PrimaryButton.js';
import Screen from '../components/Screen.js';
import { theme } from '../lib/theme.js';
import { useAuth } from '../providers/AuthProvider.js';

export default function RegisterScreen() {
  const { ready, register, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (ready && user) return <Redirect href="/catalog" />;

  async function submit() {
    setError('');
    setLoading(true);
    try {
      await register({ name, email: email.trim(), password, phone });
      router.replace('/catalog');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BrandHeader title="Join VESTORA" />
        <Text style={styles.heading}>Make room for your own style.</Text>
        <Text style={styles.description}>
          Create a customer account to save pieces and follow your orders.
        </Text>
        <View style={styles.form}>
          <Field autoComplete="name" label="Full name" onChangeText={setName} value={name} />
          <Field
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            value={email}
          />
          <Field
            autoComplete="tel"
            keyboardType="phone-pad"
            label="Phone (optional)"
            onChangeText={setPhone}
            value={phone}
          />
          <Field
            autoCapitalize="none"
            autoComplete="new-password"
            label="Password (at least 12 characters)"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <PrimaryButton loading={loading} onPress={submit} title="Create account" />
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/login" style={styles.link}>Sign in</Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 18,
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 34,
    lineHeight: 42,
  },
  description: {
    marginTop: 10,
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 15,
    marginTop: 24,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 23,
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
