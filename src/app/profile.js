import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import BottomNav from '../components/BottomNav.js';
import BrandHeader from '../components/BrandHeader.js';
import Field from '../components/Field.js';
import PrimaryButton from '../components/PrimaryButton.js';
import { theme } from '../lib/theme.js';
import { useAuth } from '../providers/AuthProvider.js';

export default function ProfileScreen() {
  const { user, ready, logout, updateProfile } = useAuth();
  const [name, setName] = useState(null);
  const [phone, setPhone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (ready && !user) return <Redirect href="/login" />;

  async function saveProfile() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateProfile({
        name: name ?? user?.name ?? '',
        phone: phone ?? user?.phone ?? '',
      });
      setMessage('Your profile has been updated.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Signed out on this device', error.message);
      router.replace('/login');
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <BrandHeader title="Your profile" />
        {user ? (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.role}>{user.role}</Text>
          </View>
        ) : null}
        <Field
          autoCapitalize="words"
          label="Name"
          onChangeText={setName}
          value={name ?? user?.name ?? ''}
        />
        <Field
          autoComplete="tel"
          keyboardType="phone-pad"
          label="Phone"
          onChangeText={setPhone}
          value={phone ?? user?.phone ?? ''}
        />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <PrimaryButton loading={saving} onPress={saveProfile} title="Save profile" />
        <PrimaryButton onPress={signOut} secondary title="Sign out" />
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  card: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderRadius: 33,
    backgroundColor: theme.colors.ink,
  },
  avatarText: {
    color: theme.colors.gold,
    fontFamily: 'Georgia',
    fontSize: 28,
  },
  name: {
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 25,
  },
  email: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  message: {
    color: theme.colors.success,
    fontSize: 13,
  },
  role: {
    marginTop: 5,
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
